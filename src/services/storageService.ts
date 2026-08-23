import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';
import { generateInstallments, addMonths } from './loanCalculator';
import { supabaseSyncService, computeCapitalBox } from './supabaseSyncService';

const CLIENTS_KEY = 'prestalo_clients';
const LOANS_KEY = 'prestalo_loans';
const INSTALLMENTS_KEY = 'prestalo_installments';
const CAPITAL_KEY = 'prestalo_capital';
const TRANSACTIONS_KEY = 'prestalo_transactions';

export const storageService = {
  // Inicialización
  initializeData(force: boolean = false) {
    const defaultBox: CapitalBox = {
      initialCapital: 0,
      currentCapital: 0,
      totalLent: 0,
      totalRecovered: 0,
      totalInterestRecovered: 0
    };

    if (force || !localStorage.getItem(CLIENTS_KEY)) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify([]));
      localStorage.setItem(LOANS_KEY, JSON.stringify([]));
      localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify([]));
      localStorage.setItem(CAPITAL_KEY, JSON.stringify(defaultBox));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    }
  },

  // CLIENTS
  getClients(): Client[] {
    this.initializeData();
    const data = localStorage.getItem(CLIENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveClient(client: Omit<Client, 'id' | 'createdAt' | 'status'> & { id?: string }): Client {
    const clients = this.getClients();
    let newClient: Client;
    
    if (client.id) {
      // Editar
      const index = clients.findIndex(c => c.id === client.id);
      if (index !== -1) {
        newClient = {
          ...clients[index],
          ...client,
          id: client.id
        };
        clients[index] = newClient;
      } else {
        throw new Error('Cliente no encontrado');
      }
    } else {
      // Crear
      newClient = {
        ...client,
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      clients.push(newClient);
    }
    
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    supabaseSyncService.syncUpClient(newClient);
    return newClient;
  },

  deleteClient(id: string): void {
    const clients = this.getClients().filter(c => c.id !== id);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    supabaseSyncService.deleteRemoteClient(id);
  },

  // LOANS
  getLoans(): Loan[] {
    this.initializeData();
    const data = localStorage.getItem(LOANS_KEY);
    return data ? JSON.parse(data) : [];
  },

  createLoan(loanData: Omit<Loan, 'id' | 'totalToPay' | 'endDate' | 'status'>): { loan: Loan; installments: Installment[] } {
    const loans = this.getLoans();
    const totalInterest = (loanData.capital * loanData.interestRate) / 100;
    const totalToPay = loanData.capital + totalInterest;
    
    const loanId = 'l_' + Math.random().toString(36).substr(2, 9);
    
    // Generar cuotas
    const installments = generateInstallments({
      loanId,
      clientId: loanData.clientId,
      clientName: loanData.clientName,
      capital: loanData.capital,
      interestRate: loanData.interestRate,
      paymentFrequency: loanData.paymentFrequency,
      installmentsCount: loanData.installmentsCount,
      startDate: loanData.startDate
    });
    
    // Fecha de vencimiento es la fecha de vencimiento de la última cuota
    const endDate = installments.length > 0 ? installments[installments.length - 1].dueDate : loanData.startDate;
    
    const newLoan: Loan = {
      ...loanData,
      id: loanId,
      totalToPay,
      endDate,
      status: 'active'
    };
    
    loans.push(newLoan);
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
    
    // Guardar cuotas
    const allInstallments = this.getInstallments();
    allInstallments.push(...installments);
    localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(allInstallments));
    
    // Registrar transacción
    const tx = this.addTransaction({
      amount: -loanData.capital,
      type: 'loan_disbursement',
      description: `Desembolso préstamo a ${loanData.clientName}`,
      referenceId: loanId
    });

    // Reconciliar caja de capital
    const capitalBox = this.reconcileCapitalBox();
    
    supabaseSyncService.syncUpLoanCreation(newLoan, installments, tx, capitalBox);
    return { loan: newLoan, installments };
  },

  deleteLoan(id: string): void {
    const loans = this.getLoans();
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    
    // Filtrar préstamos y cuotas
    const updatedLoans = loans.filter(l => l.id !== id);
    localStorage.setItem(LOANS_KEY, JSON.stringify(updatedLoans));
    
    const updatedInstallments = this.getInstallments().filter(i => i.loanId !== id);
    localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(updatedInstallments));
    
    // Registrar transacción de reverso y reconciliar caja
    let tx: CapitalTransaction | undefined;
    if (loan.status === 'active') {
      tx = this.addTransaction({
        amount: loan.capital,
        type: 'expense',
        description: `Eliminación de Préstamo Activo ID: ${loan.id}`
      });
    }
    const capitalBox = this.reconcileCapitalBox();
    supabaseSyncService.deleteRemoteLoan(id, tx, capitalBox);
  },

  // INSTALLMENTS (CUOTAS)
  normalizePactadaInstallments(inputInstallments?: Installment[], inputLoans?: Loan[]): Installment[] {
    const loans = inputLoans || this.getLoans();
    let installments = inputInstallments;
    let fromStorage = false;

    if (!installments) {
      const data = localStorage.getItem(INSTALLMENTS_KEY);
      installments = data ? JSON.parse(data) : [];
      fromStorage = true;
    }

    if (!installments || installments.length === 0) return [];

    let hasChanges = false;
    const loansMap = new Map<string, Loan>();
    loans.forEach(l => loansMap.set(l.id, l));
    const modifiedInstallments: Installment[] = [];

    installments.forEach(inst => {
      if (inst.isPactada) {
        const loan = loansMap.get(inst.loanId);
        const expectedTotal = (loan && loan.installmentsCount > 0)
          ? Math.round((loan.totalToPay / loan.installmentsCount) * 100) / 100
          : ((inst.paidAmount || 0) + inst.amount + (inst.waivedAmount || 0));

        const currentPaid = (inst.paidAmount !== undefined && inst.paidAmount > 0)
          ? inst.paidAmount
          : Math.max(0, expectedTotal - (inst.waivedAmount || 0));

        const pendingBalance = Math.max(0, expectedTotal - currentPaid);

        // Si la cuota tenía saldo pendiente pero estaba guardada con amount <= 0 o status === 'paid'
        if (pendingBalance > 0 && (inst.amount <= 0 || inst.status === 'paid')) {
          inst.amount = pendingBalance;
          const ratio = pendingBalance / (expectedTotal || 1);
          const loanCapPerInst = loan ? loan.capital / loan.installmentsCount : pendingBalance * 0.8;
          inst.capitalAmount = Math.round(loanCapPerInst * ratio);
          inst.interestAmount = pendingBalance - inst.capitalAmount;
          inst.paidAmount = currentPaid;
          inst.paidCapitalAmount = Math.round(loanCapPerInst) - inst.capitalAmount;
          inst.paidInterestAmount = currentPaid - (inst.paidCapitalAmount || 0);
          inst.status = 'pending';
          inst.paidDate = null;
          if (!inst.pactDeadline) {
            inst.pactDeadline = addMonths(inst.dueDate, 1);
          }
          if (!inst.pactDate) {
            inst.pactDate = inst.dueDate;
          }
          hasChanges = true;
          modifiedInstallments.push(inst);

          // Reactivar préstamo si estaba completed
          if (loan && loan.status === 'completed') {
            loan.status = 'active';
            const loanIdx = loans.findIndex(l => l.id === loan.id);
            if (loanIdx !== -1) loans[loanIdx] = loan;
            localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
          }
        }
      }
    });

    if (hasChanges && fromStorage) {
      localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
      if (modifiedInstallments.length > 0) {
        supabaseSyncService.syncUpPayment(modifiedInstallments, loans[0], {
          id: 'auto_norm',
          amount: 0,
          type: 'installment_payment',
          description: 'Normalización de cuota pactada',
          date: new Date().toISOString()
        }, this.getCapitalBox()).catch(() => {});
      }
    }

    return installments;
  },

  getInstallments(): Installment[] {
    this.initializeData();
    const data = localStorage.getItem(INSTALLMENTS_KEY);
    const installments: Installment[] = data ? JSON.parse(data) : [];
    return this.normalizePactadaInstallments(installments);
  },

  payInstallment(installmentId: string, customAmount?: number, isPactada?: boolean): Installment {
    const installments = this.getInstallments();
    const idx = installments.findIndex(i => i.id === installmentId);
    if (idx === -1) throw new Error('Cuota no encontrada');
    
    const installment = installments[idx];
    if (installment.amount <= 0 && installment.status === 'paid' && !installment.isPactada) return installment;
    
    const amountToPay = (customAmount !== undefined && customAmount > 0) ? customAmount : installment.amount;
    const todayStr = new Date().toISOString().split('T')[0];
    const actualPaidAmount = amountToPay;
    
    const affectedInstallments: Installment[] = [];

    if (amountToPay < installment.amount) {
      // Abono Parcial o Abono Pactado
      const ratio = amountToPay / installment.amount;
      const paidCapital = Math.round(installment.capitalAmount * ratio);
      const paidInterest = amountToPay - paidCapital;

      installment.paidAmount = (installment.paidAmount ?? 0) + amountToPay;
      installment.paidCapitalAmount = (installment.paidCapitalAmount ?? 0) + paidCapital;
      installment.paidInterestAmount = (installment.paidInterestAmount ?? 0) + paidInterest;

      // Reducir la cuota actual manteniendo el saldo pendiente para permitir abonos libres posteriores
      installment.amount -= amountToPay;
      installment.capitalAmount = Math.max(0, installment.capitalAmount - paidCapital);
      installment.interestAmount = Math.max(0, installment.interestAmount - paidInterest);

      if (isPactada || installment.isPactada) {
        installment.isPactada = true;
        if (!installment.pactDate) {
          installment.pactDate = todayStr;
        }
        if (!installment.pactDeadline) {
          installment.pactDeadline = addMonths(installment.dueDate, 1);
        }
      }

      if (installment.amount <= 0) {
        installment.status = 'paid';
        installment.paidDate = todayStr;
      } else {
        // Mantiene estado pending (o pactada con plazo de 1 mes antes de mora)
        installment.status = 'pending';
        installment.paidDate = null;
      }
    } else {
      // Pago Completo o Abono Mayor
      const originalAmount = installment.amount;
      const originalCapital = installment.capitalAmount;
      const originalInterest = installment.interestAmount;

      installment.paidAmount = (installment.paidAmount ?? 0) + originalAmount;
      installment.paidCapitalAmount = (installment.paidCapitalAmount ?? 0) + originalCapital;
      installment.paidInterestAmount = (installment.paidInterestAmount ?? 0) + originalInterest;

      installment.status = 'paid';
      installment.paidDate = todayStr;
      installment.amount = 0;
      installment.capitalAmount = 0;
      installment.interestAmount = 0;

      const excess = amountToPay - originalAmount;
      if (excess > 0) {
        // Si pagó de más, aplicar el excedente a la siguiente cuota pendiente del mismo préstamo
        const pendingLoanInstallments = installments.filter(i => i.loanId === installment.loanId && i.status !== 'paid' && i.id !== installment.id);
        if (pendingLoanInstallments.length > 0) {
          const nextInstIdx = installments.findIndex(i => i.id === pendingLoanInstallments[0].id);
          if (nextInstIdx !== -1) {
            const nextInst = installments[nextInstIdx];
            if (excess >= nextInst.amount) {
              const nextInstOriginalAmount = nextInst.amount;
              const nextInstOriginalCapital = nextInst.capitalAmount;
              const nextInstOriginalInterest = nextInst.interestAmount;

              nextInst.paidAmount = (nextInst.paidAmount ?? 0) + nextInstOriginalAmount;
              nextInst.paidCapitalAmount = (nextInst.paidCapitalAmount ?? 0) + nextInstOriginalCapital;
              nextInst.paidInterestAmount = (nextInst.paidInterestAmount ?? 0) + nextInstOriginalInterest;
              nextInst.status = 'paid';
              nextInst.paidDate = todayStr;
              nextInst.amount = 0;
              nextInst.capitalAmount = 0;
              nextInst.interestAmount = 0;
            } else {
              const ratio = excess / nextInst.amount;
              const paidCap = Math.round(nextInst.capitalAmount * ratio);
              const paidInt = excess - paidCap;

              nextInst.paidAmount = (nextInst.paidAmount ?? 0) + excess;
              nextInst.paidCapitalAmount = (nextInst.paidCapitalAmount ?? 0) + paidCap;
              nextInst.paidInterestAmount = (nextInst.paidInterestAmount ?? 0) + paidInt;
              nextInst.amount -= excess;
              nextInst.capitalAmount = Math.max(0, nextInst.capitalAmount - paidCap);
              nextInst.interestAmount = Math.max(0, nextInst.amount - nextInst.capitalAmount);
            }
            installments[nextInstIdx] = nextInst;
            affectedInstallments.push(nextInst);
          }
        }
      }
    }

    installments[idx] = installment;
    affectedInstallments.unshift(installment);
    localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
    
    // Registrar transacción con el monto abonado exacto
    const txDesc = isPactada && amountToPay < (installment.paidAmount || amountToPay)
      ? `Pago pactado Cuota #${installment.number} de ${installment.clientName}`
      : `Pago/Abono Cuota #${installment.number} de ${installment.clientName}`;

    const tx = this.addTransaction({
      amount: actualPaidAmount,
      type: 'installment_payment',
      description: txDesc,
      referenceId: installment.loanId
    });
    
    // Verificar si el préstamo se ha pagado por completo
    const loanId = installment.loanId;
    const loanInstallments = installments.filter(i => i.loanId === loanId);
    const pendingInstallments = loanInstallments.filter(i => i.status !== 'paid');
    
    const loans = this.getLoans();
    let updatedLoan: Loan | undefined;
    if (pendingInstallments.length === 0) {
      const loanIdx = loans.findIndex(l => l.id === loanId);
      if (loanIdx !== -1) {
        loans[loanIdx].status = 'completed';
        localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
        updatedLoan = loans[loanIdx];
      }
    } else {
      updatedLoan = loans.find(l => l.id === loanId);
    }

    const capitalBox = this.reconcileCapitalBox();
    
    if (updatedLoan) {
      supabaseSyncService.syncUpPayment(affectedInstallments, updatedLoan, tx, capitalBox);
    }
    
    return installment;
  },

  // CAPITAL BOX
  reconcileCapitalBox(initialCapOverride?: number): CapitalBox {
    const rawBox = this.getCapitalBox();
    const initialCap = initialCapOverride !== undefined ? initialCapOverride : rawBox.initialCapital;
    const loans = this.getLoans();
    const installments = this.getInstallments();
    const transactions = this.getTransactions();
    const reconciledBox = computeCapitalBox(initialCap, loans, installments, transactions);
    localStorage.setItem(CAPITAL_KEY, JSON.stringify(reconciledBox));
    return reconciledBox;
  },

  getCapitalBox(): CapitalBox {
    this.initializeData();
    const data = localStorage.getItem(CAPITAL_KEY);
    const defaultBox: CapitalBox = {
      initialCapital: 0,
      currentCapital: 0,
      totalLent: 0,
      totalRecovered: 0,
      totalInterestRecovered: 0
    };
    return data ? JSON.parse(data) : defaultBox;
  },

  setInitialCapital(amount: number): CapitalBox {
    const currentBox = this.getCapitalBox();
    const difference = amount - currentBox.initialCapital;
    
    const capitalBox = this.reconcileCapitalBox(amount);
    
    const tx = this.addTransaction({
      amount: difference,
      type: 'initial',
      description: `Ajuste de Capital Inicial a ${amount}`
    });
    
    supabaseSyncService.syncUpCapitalBox(capitalBox, tx);
    return capitalBox;
  },

  // TRANSACTIONS
  getTransactions(): CapitalTransaction[] {
    this.initializeData();
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addTransaction(tx: Omit<CapitalTransaction, 'id' | 'date'>): CapitalTransaction {
    const txs = this.getTransactions();
    const newTx: CapitalTransaction = {
      ...tx,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().replace('T', ' ').split('.')[0]
    };
    txs.push(newTx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
    return newTx;
  },

  // BACKUP (IMPORT / EXPORT)
  exportBackup(): string {
    const backup = {
      clients: this.getClients(),
      loans: this.getLoans(),
      installments: this.getInstallments(),
      capital: this.getCapitalBox(),
      transactions: this.getTransactions()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackup(backupStr: string): void {
    try {
      const backup = JSON.parse(backupStr);
      if (backup.clients && backup.loans && backup.installments && backup.capital) {
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(backup.clients));
        localStorage.setItem(LOANS_KEY, JSON.stringify(backup.loans));
        localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(backup.installments));
        localStorage.setItem(CAPITAL_KEY, JSON.stringify(backup.capital));
        if (backup.transactions) {
          localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(backup.transactions));
        }
        supabaseSyncService.pushAllLocalToRemote();
      } else {
        throw new Error('Formato de respaldo inválido');
      }
    } catch (e) {
      throw new Error('Error al importar el respaldo: ' + (e as Error).message);
    }
  }
};
