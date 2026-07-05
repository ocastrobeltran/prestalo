import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';
import { generateInstallments } from './loanCalculator';
import { supabaseSyncService } from './supabaseSyncService';

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
    
    // Actualizar caja de capital (Desembolso)
    const capitalBox = this.getCapitalBox();
    capitalBox.currentCapital -= loanData.capital;
    capitalBox.totalLent += loanData.capital;
    localStorage.setItem(CAPITAL_KEY, JSON.stringify(capitalBox));
    
    // Registrar transacción
    const tx = this.addTransaction({
      amount: -loanData.capital,
      type: 'loan_disbursement',
      description: `Desembolso préstamo a ${loanData.clientName}`,
      referenceId: loanId
    });
    
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
    
    // Revertir caja de capital si el préstamo estaba activo
    let tx: CapitalTransaction | undefined;
    let capitalBox: CapitalBox | undefined;
    if (loan.status === 'active') {
      capitalBox = this.getCapitalBox();
      capitalBox.currentCapital += loan.capital;
      capitalBox.totalLent -= loan.capital;
      localStorage.setItem(CAPITAL_KEY, JSON.stringify(capitalBox));
      
      tx = this.addTransaction({
        amount: loan.capital,
        type: 'expense',
        description: `Eliminación de Préstamo Activo ID: ${loan.id}`
      });
    }
    supabaseSyncService.deleteRemoteLoan(id, tx, capitalBox);
  },

  // INSTALLMENTS (CUOTAS)
  getInstallments(): Installment[] {
    this.initializeData();
    const data = localStorage.getItem(INSTALLMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  payInstallment(installmentId: string): Installment {
    const installments = this.getInstallments();
    const idx = installments.findIndex(i => i.id === installmentId);
    if (idx === -1) throw new Error('Cuota no encontrada');
    
    const installment = installments[idx];
    if (installment.status === 'paid') return installment;
    
    // Actualizar estado
    installment.status = 'paid';
    installment.paidDate = new Date().toISOString().split('T')[0];
    installments[idx] = installment;
    localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
    
    // Registrar entrada de capital e interés en la caja
    const capitalBox = this.getCapitalBox();
    capitalBox.currentCapital += installment.amount;
    capitalBox.totalLent -= installment.capitalAmount;
    capitalBox.totalRecovered += installment.capitalAmount;
    capitalBox.totalInterestRecovered += installment.interestAmount;
    localStorage.setItem(CAPITAL_KEY, JSON.stringify(capitalBox));
    
    // Registrar transacción
    const tx = this.addTransaction({
      amount: installment.amount,
      type: 'installment_payment',
      description: `Pago Cuota #${installment.number} de ${installment.clientName}`,
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
    
    if (updatedLoan) {
      supabaseSyncService.syncUpPayment(installment, updatedLoan, tx, capitalBox);
    }
    
    return installment;
  },

  // CAPITAL BOX
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
    const capitalBox = this.getCapitalBox();
    const difference = amount - capitalBox.initialCapital;
    
    capitalBox.initialCapital = amount;
    capitalBox.currentCapital += difference;
    
    localStorage.setItem(CAPITAL_KEY, JSON.stringify(capitalBox));
    
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
