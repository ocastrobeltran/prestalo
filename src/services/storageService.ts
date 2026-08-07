import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';
import { generateInstallments } from './loanCalculator';
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
  getInstallments(): Installment[] {
    this.initializeData();
    const data = localStorage.getItem(INSTALLMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  payInstallment(installmentId: string, customAmount?: number): Installment {
    const installments = this.getInstallments();
    const idx = installments.findIndex(i => i.id === installmentId);
    if (idx === -1) throw new Error('Cuota no encontrada');
    
    const installment = installments[idx];
    if (installment.status === 'paid') return installment;
    
    const amountToPay = (customAmount !== undefined && customAmount > 0) ? customAmount : installment.amount;
    const todayStr = new Date().toISOString().split('T')[0];
    const actualPaidAmount = amountToPay;
    
    if (amountToPay < installment.amount) {
      // Abono Parcial: calcular proporciones de capital e interés pagados
      const ratio = amountToPay / installment.amount;
      const paidCapital = Math.round(installment.capitalAmount * ratio);
      const paidInterest = amountToPay - paidCapital;

      // Reducir la cuota actual con el saldo que falta por pagar
      installment.amount -= amountToPay;
      installment.capitalAmount = Math.max(0, installment.capitalAmount - paidCapital);
      installment.interestAmount = Math.max(0, installment.interestAmount - paidInterest);

      if (installment.amount <= 0) {
        installment.status = 'paid';
        installment.paidDate = todayStr;
      }
    } else {
      // Pago Completo o Abono Mayor
      const originalAmount = installment.amount;
      installment.status = 'paid';
      installment.paidDate = todayStr;

      const excess = amountToPay - originalAmount;
      if (excess > 0) {
        // Si pagó de más, aplicar el excedente a la siguiente cuota pendiente del mismo préstamo
        const pendingLoanInstallments = installments.filter(i => i.loanId === installment.loanId && i.status !== 'paid' && i.id !== installment.id);
        if (pendingLoanInstallments.length > 0) {
          const nextInstIdx = installments.findIndex(i => i.id === pendingLoanInstallments[0].id);
          if (nextInstIdx !== -1) {
            const nextInst = installments[nextInstIdx];
            if (excess >= nextInst.amount) {
              nextInst.status = 'paid';
              nextInst.paidDate = todayStr;
            } else {
              const ratio = excess / nextInst.amount;
              const paidCap = Math.round(nextInst.capitalAmount * ratio);
              nextInst.amount -= excess;
              nextInst.capitalAmount = Math.max(0, nextInst.capitalAmount - paidCap);
              nextInst.interestAmount = Math.max(0, nextInst.amount - nextInst.capitalAmount);
            }
            installments[nextInstIdx] = nextInst;
          }
        }
      }
    }

    installments[idx] = installment;
    localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
    
    // Registrar transacción con el monto abonado exacto
    const tx = this.addTransaction({
      amount: actualPaidAmount,
      type: 'installment_payment',
      description: `Pago/Abono Cuota #${installment.number} de ${installment.clientName}`,
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
      supabaseSyncService.syncUpPayment(installment, updatedLoan, tx, capitalBox);
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
