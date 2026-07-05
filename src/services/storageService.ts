import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';
import { generateInstallments } from './loanCalculator';
import { supabaseSyncService } from './supabaseSyncService';

const CLIENTS_KEY = 'prestalo_clients';
const LOANS_KEY = 'prestalo_loans';
const INSTALLMENTS_KEY = 'prestalo_installments';
const CAPITAL_KEY = 'prestalo_capital';
const TRANSACTIONS_KEY = 'prestalo_transactions';

// Datos semilla basados exactamente en las capturas del cliente
const SEED_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Adys Taylor',
    phone: '+57 322 5744121',
    documentId: '1047123456',
    address: 'Nequi',
    createdAt: '2026-07-01',
    status: 'active'
  },
  {
    id: 'c2',
    name: 'Ariel Machacon',
    phone: '3812949494',
    documentId: '73123456',
    address: 'Lo Amador',
    createdAt: '2026-07-01',
    status: 'active'
  },
  {
    id: 'c3',
    name: 'Javier Ricardo',
    phone: '+57 301 3030494',
    documentId: '1047987654',
    address: 'Calle De Las Florez',
    createdAt: '2026-07-01',
    status: 'active'
  },
  {
    id: 'c4',
    name: 'Jhon',
    phone: '3043677840',
    documentId: '92456789',
    address: 'Al Lado Del Local',
    createdAt: '2026-07-01',
    status: 'active'
  },
  {
    id: 'c5',
    name: 'Yeison Ricardo',
    phone: '+57 300 1234567',
    documentId: '1143876543',
    address: 'Calle Real #45',
    createdAt: '2026-07-01',
    status: 'active'
  },
  {
    id: 'c6',
    name: 'Sirly',
    phone: '+57 310 9876543',
    documentId: '45678901',
    address: 'Avenida Principal',
    createdAt: '2026-07-01',
    status: 'active'
  }
];

const SEED_LOANS: Loan[] = [
  {
    id: 'l1',
    clientId: 'c3',
    clientName: 'Javier Ricardo',
    capital: 1000000,
    interestRate: 20,
    totalToPay: 1200000,
    paymentFrequency: 'monthly',
    installmentsCount: 1,
    startDate: '2026-06-30',
    endDate: '2026-07-30',
    status: 'active'
  },
  {
    id: 'l2',
    clientId: 'c5',
    clientName: 'Yeison Ricardo',
    capital: 300000,
    interestRate: 20,
    totalToPay: 360000, // Capital $300k + $60k interest
    paymentFrequency: 'monthly',
    installmentsCount: 1,
    startDate: '2026-06-27',
    endDate: '2026-07-27',
    status: 'active'
  },
  {
    id: 'l3',
    clientId: 'c4',
    clientName: 'Jhon',
    capital: 500000,
    interestRate: 20,
    totalToPay: 600000,
    paymentFrequency: 'weekly',
    installmentsCount: 5,
    startDate: '2026-07-01',
    endDate: '2026-08-05',
    status: 'active'
  }
];

const SEED_CAPITAL: CapitalBox = {
  initialCapital: 10000000, // 10 Millones
  currentCapital: 8200000, // 10M - (1M + 300k + 500k)
  totalLent: 1800000,     // 1M + 300k + 500k
  totalRecovered: 0,
  totalInterestRecovered: 0
};

// Generar cuotas semilla
const getSeedInstallments = (): Installment[] => {
  const installments: Installment[] = [];
  
  // Javier Ricardo: 1 cuota de $1.200.000 vence 30/07/2026
  installments.push({
    id: 'l1-c1',
    loanId: 'l1',
    clientId: 'c3',
    clientName: 'Javier Ricardo',
    number: 1,
    amount: 1200000,
    capitalAmount: 1000000,
    interestAmount: 200000,
    dueDate: '2026-07-30',
    paidDate: null,
    status: 'pending'
  });

  // Yeison Ricardo: 1 cuota de $360.000 vence 27/07/2026
  installments.push({
    id: 'l2-c1',
    loanId: 'l2',
    clientId: 'c5',
    clientName: 'Yeison Ricardo',
    number: 1,
    amount: 360000,
    capitalAmount: 300000,
    interestAmount: 600000,
    dueDate: '2026-07-27',
    paidDate: null,
    status: 'pending'
  });

  // Jhon: 5 cuotas semanales de $120.000 cada una
  // Primera cuota vence 08/07/2026 (según captura, "Cuota #1 Jhon $120.000 vence 08/07/2026")
  let currentDueDate = '2026-07-01';
  for (let i = 1; i <= 5; i++) {
    currentDueDate = new Date(new Date(currentDueDate + 'T12:00:00').getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    installments.push({
      id: `l3-c${i}`,
      loanId: 'l3',
      clientId: 'c4',
      clientName: 'Jhon',
      number: i,
      amount: 120000,
      capitalAmount: 100000,
      interestAmount: 20000,
      dueDate: currentDueDate,
      paidDate: null,
      status: 'pending'
    });
  }

  return installments;
};

const SEED_TRANSACTIONS: CapitalTransaction[] = [
  {
    id: 't-init',
    amount: 10000000,
    type: 'initial',
    description: 'Apertura de Capital Inicial',
    date: '2026-07-01 08:00:00'
  },
  {
    id: 't-l1',
    amount: -1000000,
    type: 'loan_disbursement',
    description: 'Desembolso Préstamo Javier Ricardo',
    date: '2026-06-30 10:30:00',
    referenceId: 'l1'
  },
  {
    id: 't-l2',
    amount: -300000,
    type: 'loan_disbursement',
    description: 'Desembolso Préstamo Yeison Ricardo',
    date: '2026-06-27 14:15:00',
    referenceId: 'l2'
  },
  {
    id: 't-l3',
    amount: -500000,
    type: 'loan_disbursement',
    description: 'Desembolso Préstamo Jhon',
    date: '2026-07-01 11:00:00',
    referenceId: 'l3'
  }
];

export const storageService = {
  // Inicialización
  initializeData(force: boolean = false) {
    if (force || !localStorage.getItem(CLIENTS_KEY)) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(SEED_CLIENTS));
      localStorage.setItem(LOANS_KEY, JSON.stringify(SEED_LOANS));
      localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(getSeedInstallments()));
      localStorage.setItem(CAPITAL_KEY, JSON.stringify(SEED_CAPITAL));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
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
    return data ? JSON.parse(data) : SEED_CAPITAL;
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
