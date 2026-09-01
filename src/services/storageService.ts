import type { Client, Loan, Installment, CapitalBox, CapitalTransaction, UserProfile } from '../types';
import { generateInstallments, addMonths, getNextPaymentDate, getRenewalStepLabel } from './loanCalculator';
import { supabaseSyncService, computeCapitalBox, setSyncUserId } from './supabaseSyncService';

let currentUserId: string | null = null;

const getKey = (baseKey: string) => {
  return currentUserId ? `credipresta_${currentUserId}_${baseKey}` : `credipresta_${baseKey}`;
};

export const storageService = {
  // Configurar usuario actual y aislar espacio de almacenamiento local
  setCurrentUser(userId: string | null) {
    currentUserId = userId;
    setSyncUserId(userId);
    if (userId) {
      this.initializeData();
    }
  },

  getCurrentUserId(): string | null {
    return currentUserId;
  },

  // Limpiar datos locales del usuario actual (al cerrar sesión)
  clearUserData() {
    if (currentUserId) {
      localStorage.removeItem(getKey('clients'));
      localStorage.removeItem(getKey('loans'));
      localStorage.removeItem(getKey('installments'));
      localStorage.removeItem(getKey('capital'));
      localStorage.removeItem(getKey('transactions'));
      localStorage.removeItem(getKey('profile'));
    }
    currentUserId = null;
    setSyncUserId(null);
  },

  // USER PROFILE
  getUserProfile(): UserProfile {
    const data = localStorage.getItem(getKey('profile')) || (currentUserId ? localStorage.getItem(`prestalo_${currentUserId}_profile`) : null);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
    return {
      fullName: '',
      businessName: '',
      phone: '',
      email: '',
      currencySymbol: '$'
    };
  },

  saveUserProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
      userId: currentUserId || undefined,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(getKey('profile'), JSON.stringify(updated));
    return updated;
  },

  // Inicialización
  initializeData(force: boolean = false) {
    const defaultBox: CapitalBox = {
      initialCapital: 0,
      currentCapital: 0,
      totalLent: 0,
      totalRecovered: 0,
      totalInterestRecovered: 0
    };

    const clientsKey = getKey('clients');
    if (force || !localStorage.getItem(clientsKey)) {
      // Migración transparente: Si existen datos previos en claves globales o prestalo, preservarlos para el usuario actual
      const legacyClients = (currentUserId && localStorage.getItem(`prestalo_${currentUserId}_clients`)) ||
        localStorage.getItem('credipresta_clients') ||
        localStorage.getItem('prestalo_clients');

      if (currentUserId && legacyClients && !force) {
        localStorage.setItem(getKey('clients'), legacyClients);
        localStorage.setItem(getKey('loans'), localStorage.getItem(`prestalo_${currentUserId}_loans`) || localStorage.getItem('prestalo_loans') || JSON.stringify([]));
        localStorage.setItem(getKey('installments'), localStorage.getItem(`prestalo_${currentUserId}_installments`) || localStorage.getItem('prestalo_installments') || JSON.stringify([]));
        localStorage.setItem(getKey('capital'), localStorage.getItem(`prestalo_${currentUserId}_capital`) || localStorage.getItem('prestalo_capital') || JSON.stringify(defaultBox));
        localStorage.setItem(getKey('transactions'), localStorage.getItem(`prestalo_${currentUserId}_transactions`) || localStorage.getItem('prestalo_transactions') || JSON.stringify([]));
      } else {
        localStorage.setItem(getKey('clients'), JSON.stringify([]));
        localStorage.setItem(getKey('loans'), JSON.stringify([]));
        localStorage.setItem(getKey('installments'), JSON.stringify([]));
        localStorage.setItem(getKey('capital'), JSON.stringify(defaultBox));
        localStorage.setItem(getKey('transactions'), JSON.stringify([]));
      }
    }
  },

  // CLIENTS
  getClients(): Client[] {
    this.initializeData();
    const data = localStorage.getItem(getKey('clients'));
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
          userId: currentUserId || clients[index].userId,
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
        userId: currentUserId || undefined,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      clients.push(newClient);
    }
    
    localStorage.setItem(getKey('clients'), JSON.stringify(clients));
    supabaseSyncService.syncUpClient(newClient);
    return newClient;
  },

  deleteClient(id: string): void {
    const clients = this.getClients().filter(c => c.id !== id);
    localStorage.setItem(getKey('clients'), JSON.stringify(clients));
    supabaseSyncService.deleteRemoteClient(id);
  },

  // LOANS
  getLoans(): Loan[] {
    this.initializeData();
    const data = localStorage.getItem(getKey('loans'));
    return data ? JSON.parse(data) : [];
  },

  createLoan(loanData: Omit<Loan, 'id' | 'totalToPay' | 'endDate' | 'status'>): { loan: Loan; installments: Installment[] } {
    const loans = this.getLoans();
    const totalInterest = (loanData.capital * loanData.interestRate) / 100;
    const totalToPay = loanData.capital + totalInterest;
    
    const loanId = 'l_' + Math.random().toString(36).substr(2, 9);
    
    // Generar cuotas
    const rawInstallments = generateInstallments({
      loanId,
      clientId: loanData.clientId,
      clientName: loanData.clientName,
      capital: loanData.capital,
      interestRate: loanData.interestRate,
      paymentFrequency: loanData.paymentFrequency,
      installmentsCount: loanData.installmentsCount,
      startDate: loanData.startDate
    });

    const installments = rawInstallments.map(i => ({
      ...i,
      userId: currentUserId || undefined
    }));
    
    // Fecha de vencimiento es la fecha de vencimiento de la última cuota
    const endDate = installments.length > 0 ? installments[installments.length - 1].dueDate : loanData.startDate;
    
    const newLoan: Loan = {
      ...loanData,
      id: loanId,
      userId: currentUserId || undefined,
      totalToPay,
      endDate,
      status: 'active'
    };
    
    loans.push(newLoan);
    localStorage.setItem(getKey('loans'), JSON.stringify(loans));
    
    // Guardar cuotas
    const allInstallments = this.getInstallments();
    allInstallments.push(...installments);
    localStorage.setItem(getKey('installments'), JSON.stringify(allInstallments));
    
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
    localStorage.setItem(getKey('loans'), JSON.stringify(updatedLoans));
    
    const updatedInstallments = this.getInstallments().filter(i => i.loanId !== id);
    localStorage.setItem(getKey('installments'), JSON.stringify(updatedInstallments));
    
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
    const data = localStorage.getItem(getKey('installments'));
    return data ? JSON.parse(data) : [];
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
        // Excedente aplicado a cuotas posteriores
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
              affectedInstallments.push(nextInst);
            } else {
              const nextRatio = excess / nextInst.amount;
              const nextPaidCapital = Math.round(nextInst.capitalAmount * nextRatio);
              const nextPaidInterest = excess - nextPaidCapital;

              nextInst.paidAmount = (nextInst.paidAmount ?? 0) + excess;
              nextInst.paidCapitalAmount = (nextInst.paidCapitalAmount ?? 0) + nextPaidCapital;
              nextInst.paidInterestAmount = (nextInst.paidInterestAmount ?? 0) + nextPaidInterest;
              nextInst.amount -= excess;
              nextInst.capitalAmount = Math.max(0, nextInst.capitalAmount - nextPaidCapital);
              nextInst.interestAmount = Math.max(0, nextInst.interestAmount - nextPaidInterest);
              affectedInstallments.push(nextInst);
            }
          }
        }
      }
    }

    installments[idx] = installment;
    localStorage.setItem(getKey('installments'), JSON.stringify(installments));

    // Verificar si el préstamo se completó totalmente
    const loanInstallments = installments.filter(i => i.loanId === installment.loanId);
    const allPaid = loanInstallments.every(i => i.status === 'paid' || i.amount <= 0);
    
    let updatedLoan: Loan | undefined;
    if (allPaid) {
      const loans = this.getLoans();
      const lIdx = loans.findIndex(l => l.id === installment.loanId);
      if (lIdx !== -1) {
        loans[lIdx].status = 'completed';
        updatedLoan = loans[lIdx];
        localStorage.setItem(getKey('loans'), JSON.stringify(loans));
      }
    }

    // Registrar transacción de ingreso en caja
    const isTotalPactadaPayment = isPactada && installment.status === 'paid' && amountToPay < (installment.paidAmount || 0);
    const tx = this.addTransaction({
      amount: actualPaidAmount,
      type: 'installment_payment',
      description: isTotalPactadaPayment
        ? `Pago Pactado Saldo Cuota #${installment.number} - ${installment.clientName}`
        : `Pago Cuota #${installment.number} - ${installment.clientName} (Abono: $${actualPaidAmount})`,
      referenceId: installment.loanId
    });

    const capitalBox = this.reconcileCapitalBox();

    const currentLoan = updatedLoan || this.getLoans().find(l => l.id === installment.loanId);
    if (currentLoan) {
      const allToSync = [installment, ...affectedInstallments];
      supabaseSyncService.syncUpPayment(allToSync, currentLoan, tx, capitalBox);
    }

    return installment;
  },

  renewInstallmentWithInterest(installmentId: string, interestAmount: number): Installment {
    const installments = this.getInstallments();
    const idx = installments.findIndex(i => i.id === installmentId);
    if (idx === -1) throw new Error('Cuota no encontrada');

    const installment = installments[idx];
    const loans = this.getLoans();
    const loanIdx = loans.findIndex(l => l.id === installment.loanId);
    if (loanIdx === -1) throw new Error('Préstamo no encontrado');

    const loan = loans[loanIdx];
    const todayStr = new Date().toISOString().split('T')[0];
    const frequency = loan.paymentFrequency || 'monthly';
    const nextDueDate = getNextPaymentDate(installment.dueDate, frequency);

    installment.paidAmount = (installment.paidAmount ?? 0) + interestAmount;
    installment.paidInterestAmount = (installment.paidInterestAmount ?? 0) + interestAmount;
    installment.dueDate = nextDueDate;
    installment.status = 'pending';
    installment.renewalsCount = (installment.renewalsCount || 0) + 1;
    installment.lastRenewalDate = todayStr;

    installments[idx] = installment;
    localStorage.setItem(getKey('installments'), JSON.stringify(installments));

    loan.totalToPay = Number(loan.totalToPay) + Number(interestAmount);
    loan.renewalsCount = (loan.renewalsCount || 0) + 1;
    loan.endDate = nextDueDate;
    loans[loanIdx] = loan;
    localStorage.setItem(getKey('loans'), JSON.stringify(loans));

    const stepLabel = getRenewalStepLabel(frequency);
    const tx = this.addTransaction({
      amount: interestAmount,
      type: 'installment_payment',
      description: `Renovación de plazo (${stepLabel}) Cuota #${installment.number} - ${installment.clientName} (Interés cobrado: $${interestAmount})`,
      referenceId: installment.loanId
    });

    const capitalBox = this.reconcileCapitalBox();
    supabaseSyncService.syncUpPayment(installment, loan, tx, capitalBox);

    return installment;
  },

  // CAPITAL BOX (CAJA DE CAPITAL)
  reconcileCapitalBox(initialCapOverride?: number): CapitalBox {
    const rawBox = this.getCapitalBox();
    const initialCap = initialCapOverride !== undefined ? initialCapOverride : rawBox.initialCapital;
    const loans = this.getLoans();
    const installments = this.getInstallments();
    const transactions = this.getTransactions();
    const reconciledBox = computeCapitalBox(initialCap, loans, installments, transactions);
    reconciledBox.userId = currentUserId || undefined;
    localStorage.setItem(getKey('capital'), JSON.stringify(reconciledBox));
    return reconciledBox;
  },

  getCapitalBox(): CapitalBox {
    this.initializeData();
    const data = localStorage.getItem(getKey('capital'));
    const defaultBox: CapitalBox = {
      initialCapital: 0,
      currentCapital: 0,
      totalLent: 0,
      totalRecovered: 0,
      totalInterestRecovered: 0,
      userId: currentUserId || undefined
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
    const data = localStorage.getItem(getKey('transactions'));
    return data ? JSON.parse(data) : [];
  },

  addTransaction(tx: Omit<CapitalTransaction, 'id' | 'date'>): CapitalTransaction {
    const txs = this.getTransactions();
    const newTx: CapitalTransaction = {
      ...tx,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId: currentUserId || undefined,
      date: new Date().toISOString().replace('T', ' ').split('.')[0]
    };
    txs.push(newTx);
    localStorage.setItem(getKey('transactions'), JSON.stringify(txs));
    return newTx;
  },

  // BACKUP (IMPORT / EXPORT)
  exportBackup(): string {
    const backup = {
      userId: currentUserId,
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
        localStorage.setItem(getKey('clients'), JSON.stringify(backup.clients));
        localStorage.setItem(getKey('loans'), JSON.stringify(backup.loans));
        localStorage.setItem(getKey('installments'), JSON.stringify(backup.installments));
        localStorage.setItem(getKey('capital'), JSON.stringify(backup.capital));
        if (backup.transactions) {
          localStorage.setItem(getKey('transactions'), JSON.stringify(backup.transactions));
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
