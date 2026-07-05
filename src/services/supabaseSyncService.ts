import { supabase } from './supabaseClient';
import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';

// Claves locales sincronizadas con storageService
const CLIENTS_KEY = 'prestalo_clients';
const LOANS_KEY = 'prestalo_loans';
const INSTALLMENTS_KEY = 'prestalo_installments';
const CAPITAL_KEY = 'prestalo_capital_box';
const TRANSACTIONS_KEY = 'prestalo_transactions';

const getLocal = <T>(key: string, fallback: T): T => {
  const d = localStorage.getItem(key);
  return d ? JSON.parse(d) : fallback;
};

const defaultBox: CapitalBox = { initialCapital: 10000000, currentCapital: 8200000, totalLent: 1800000, totalRecovered: 0, totalInterestRecovered: 0 };

// Mappers TS <-> DB
const toDbClient = (c: Client) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  document_id: c.documentId,
  address: c.address,
  created_at: c.createdAt,
  status: c.status
});

const fromDbClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  documentId: row.document_id,
  address: row.address,
  createdAt: row.created_at,
  status: row.status
});

const toDbLoan = (l: Loan) => ({
  id: l.id,
  client_id: l.clientId,
  client_name: l.clientName,
  capital: l.capital,
  interest_rate: l.interestRate,
  total_to_pay: l.totalToPay,
  payment_frequency: l.paymentFrequency,
  installments_count: l.installmentsCount,
  start_date: l.startDate,
  end_date: l.endDate,
  status: l.status
});

const fromDbLoan = (row: any): Loan => ({
  id: row.id,
  clientId: row.client_id,
  clientName: row.client_name,
  capital: Number(row.capital),
  interestRate: Number(row.interest_rate),
  totalToPay: Number(row.total_to_pay),
  paymentFrequency: row.payment_frequency,
  installmentsCount: Number(row.installments_count),
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status
});

const toDbInstallment = (i: Installment) => ({
  id: i.id,
  loan_id: i.loanId,
  client_id: i.clientId,
  client_name: i.clientName,
  number: i.number,
  amount: i.amount,
  capital_amount: i.capitalAmount,
  interest_amount: i.interestAmount,
  due_date: i.dueDate,
  paid_date: i.paidDate || null,
  status: i.status
});

const fromDbInstallment = (row: any): Installment => ({
  id: row.id,
  loanId: row.loan_id,
  clientId: row.client_id,
  clientName: row.client_name,
  number: Number(row.number),
  amount: Number(row.amount),
  capitalAmount: Number(row.capital_amount),
  interestAmount: Number(row.interest_amount),
  dueDate: row.due_date,
  paidDate: row.paid_date || null,
  status: row.status
});

const toDbCapitalBox = (cb: CapitalBox) => ({
  id: 'main_box',
  initial_capital: cb.initialCapital,
  current_capital: cb.currentCapital,
  total_lent: cb.totalLent,
  total_recovered: cb.totalRecovered,
  total_interest_recovered: cb.totalInterestRecovered
});

const fromDbCapitalBox = (row: any): CapitalBox => ({
  initialCapital: Number(row.initial_capital),
  currentCapital: Number(row.current_capital),
  totalLent: Number(row.total_lent),
  totalRecovered: Number(row.total_recovered),
  totalInterestRecovered: Number(row.total_interest_recovered)
});

const toDbTransaction = (t: CapitalTransaction) => ({
  id: t.id,
  amount: t.amount,
  type: t.type,
  description: t.description,
  date: t.date,
  reference_id: t.referenceId || null
});

const fromDbTransaction = (row: any): CapitalTransaction => ({
  id: row.id,
  amount: Number(row.amount),
  type: row.type,
  description: row.description,
  date: row.date,
  referenceId: row.reference_id || undefined
});

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

type StatusListener = (status: SyncStatus) => void;
const listeners: StatusListener[] = [];

let currentStatus: SyncStatus = 'offline';

export const supabaseSyncService = {
  getStatus(): SyncStatus {
    return currentStatus;
  },

  setStatus(status: SyncStatus) {
    currentStatus = status;
    listeners.forEach(l => l(status));
  },

  subscribeStatus(listener: StatusListener) {
    listeners.push(listener);
    listener(currentStatus);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },

  isOnline(): boolean {
    return navigator.onLine;
  },

  // Descargar datos de Supabase y actualizar localStorage
  async syncDown(onComplete?: () => void): Promise<boolean> {
    if (!this.isOnline()) {
      this.setStatus('offline');
      return false;
    }

    try {
      this.setStatus('syncing');

      // Consultar clientes en Supabase
      const { data: clientsData, error: clientsErr } = await supabase.from('clients').select('*');
      if (clientsErr) throw clientsErr;

      // Descargar el resto de tablas de Supabase para mantener sincronizado
      const { data: loansData, error: loansErr } = await supabase.from('loans').select('*');
      if (loansErr) throw loansErr;

      const { data: instData, error: instErr } = await supabase.from('installments').select('*');
      if (instErr) throw instErr;

      const { data: boxData, error: boxErr } = await supabase.from('capital_box').select('*').eq('id', 'main_box').single();
      if (boxErr && boxErr.code !== 'PGRST116') console.warn('Caja no encontrada en remote', boxErr);

      const { data: txData, error: txErr } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txErr) throw txErr;

      // Mapear y guardar en localStorage
      const clients = (clientsData || []).map(fromDbClient);
      const loans = (loansData || []).map(fromDbLoan);
      const installments = (instData || []).map(fromDbInstallment);
      const capitalBox = boxData ? fromDbCapitalBox(boxData) : getLocal<CapitalBox>(CAPITAL_KEY, defaultBox);
      const transactions = (txData || []).map(fromDbTransaction);

      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
      localStorage.setItem(INSTALLMENTS_KEY, JSON.stringify(installments));
      localStorage.setItem(CAPITAL_KEY, JSON.stringify(capitalBox));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

      this.setStatus('synced');
      window.dispatchEvent(new Event('prestalo_sync_updated'));
      if (onComplete) onComplete();
      return true;
    } catch (err) {
      console.error('Error en syncDown Supabase:', err);
      this.setStatus('error');
      return false;
    }
  },

  // Subir todo el localStorage a Supabase (inicialización o rescate)
  async pushAllLocalToRemote(): Promise<void> {
    if (!this.isOnline()) return;

    try {
      const clients = getLocal<Client[]>(CLIENTS_KEY, []).map(toDbClient);
      const loans = getLocal<Loan[]>(LOANS_KEY, []).map(toDbLoan);
      const installments = getLocal<Installment[]>(INSTALLMENTS_KEY, []).map(toDbInstallment);
      const capitalBox = toDbCapitalBox(getLocal<CapitalBox>(CAPITAL_KEY, defaultBox));
      const transactions = getLocal<CapitalTransaction[]>(TRANSACTIONS_KEY, []).map(toDbTransaction);

      if (clients.length > 0) await supabase.from('clients').upsert(clients);
      if (loans.length > 0) await supabase.from('loans').upsert(loans);
      if (installments.length > 0) await supabase.from('installments').upsert(installments);
      await supabase.from('capital_box').upsert(capitalBox);
      if (transactions.length > 0) await supabase.from('transactions').upsert(transactions);

      console.log('Sincronización inicial hacia Supabase completada.');
    } catch (err) {
      console.error('Error en pushAllLocalToRemote:', err);
    }
  },

  // MUTACIONES ASÍNCRONAS EN SEGUNDO PLANO
  async syncUpClient(client: Client): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      await supabase.from('clients').upsert(toDbClient(client));
      this.setStatus('synced');
    } catch (err) {
      console.error('Error syncUpClient:', err);
      this.setStatus('error');
    }
  },

  async deleteRemoteClient(id: string): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      await supabase.from('clients').delete().eq('id', id);
      this.setStatus('synced');
    } catch (err) {
      console.error('Error deleteRemoteClient:', err);
      this.setStatus('error');
    }
  },

  async syncUpLoanCreation(loan: Loan, installments: Installment[], tx: CapitalTransaction, box: CapitalBox): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      await supabase.from('loans').upsert(toDbLoan(loan));
      await supabase.from('installments').upsert(installments.map(toDbInstallment));
      await supabase.from('transactions').upsert(toDbTransaction(tx));
      await supabase.from('capital_box').upsert(toDbCapitalBox(box));
      this.setStatus('synced');
    } catch (err) {
      console.error('Error syncUpLoanCreation:', err);
      this.setStatus('error');
    }
  },

  async deleteRemoteLoan(id: string, tx?: CapitalTransaction, box?: CapitalBox): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      await supabase.from('loans').delete().eq('id', id);
      if (tx) await supabase.from('transactions').upsert(toDbTransaction(tx));
      if (box) await supabase.from('capital_box').upsert(toDbCapitalBox(box));
      this.setStatus('synced');
    } catch (err) {
      console.error('Error deleteRemoteLoan:', err);
      this.setStatus('error');
    }
  },

  async syncUpPayment(inst: Installment, loan: Loan, tx: CapitalTransaction, box: CapitalBox): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      await supabase.from('installments').upsert(toDbInstallment(inst));
      await supabase.from('loans').upsert(toDbLoan(loan));
      await supabase.from('transactions').upsert(toDbTransaction(tx));
      await supabase.from('capital_box').upsert(toDbCapitalBox(box));
      this.setStatus('synced');
    } catch (err) {
      console.error('Error syncUpPayment:', err);
      this.setStatus('error');
    }
  },

  async syncUpCapitalBox(box: CapitalBox, tx?: CapitalTransaction): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      await supabase.from('capital_box').upsert(toDbCapitalBox(box));
      if (tx) await supabase.from('transactions').upsert(toDbTransaction(tx));
      this.setStatus('synced');
    } catch (err) {
      console.error('Error syncUpCapitalBox:', err);
      this.setStatus('error');
    }
  }
};
