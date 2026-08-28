import { supabase } from './supabaseClient';
import type { Client, Loan, Installment, CapitalBox, CapitalTransaction, UserSubscription } from '../types';
import { getPaidBreakdownForInstallment, addMonths } from './loanCalculator';

// Claves locales sincronizadas con storageService
let currentUserId: string | null = null;

export const setSyncUserId = (userId: string | null) => {
  currentUserId = userId;
};

const getKey = (baseKey: string) => {
  return currentUserId ? `prestalo_${currentUserId}_${baseKey}` : `prestalo_${baseKey}`;
};

const getLocal = <T>(baseKey: string, fallback: T): T => {
  const d = localStorage.getItem(getKey(baseKey));
  return d ? JSON.parse(d) : fallback;
};

const setLocal = <T>(baseKey: string, value: T): void => {
  localStorage.setItem(getKey(baseKey), JSON.stringify(value));
};

const defaultBox: CapitalBox = { initialCapital: 0, currentCapital: 0, totalLent: 0, totalRecovered: 0, totalInterestRecovered: 0 };

export const computeCapitalBox = (
  initialCapital: number,
  loans: Loan[],
  installments: Installment[],
  transactions: CapitalTransaction[] = []
): CapitalBox => {
  const loansMap = new Map<string, Loan>();
  loans.forEach(l => loansMap.set(l.id, l));

  let totalRecovered = 0;
  let totalInterestRecovered = 0;
  let totalPaidAmount = 0;

  installments.forEach(inst => {
    const loan = loansMap.get(inst.loanId);
    const { paidCapital, paidInterest, paidTotal } = getPaidBreakdownForInstallment(inst, loan);
    totalRecovered += paidCapital;
    totalInterestRecovered += paidInterest;
    totalPaidAmount += paidTotal;
  });

  const pendingInstallments = installments.filter(i => i.status !== 'paid' && i.amount > 0);
  const totalLent = pendingInstallments.reduce((acc, curr) => acc + curr.capitalAmount, 0);

  const totalDisbursed = loans.reduce((acc, curr) => acc + curr.capital, 0);

  const manualAdjustments = transactions.reduce((acc, curr) => {
    if (curr.type === 'income') return acc + curr.amount;
    if (curr.type === 'expense') return acc - Math.abs(curr.amount);
    return acc;
  }, 0);

  const currentCapital = initialCapital - totalDisbursed + totalPaidAmount + manualAdjustments;

  return {
    initialCapital,
    currentCapital,
    totalLent,
    totalRecovered,
    totalInterestRecovered
  };
};

// Mappers TS <-> DB con aislamiento por user_id
const toDbClient = (c: Client, userId?: string) => ({
  id: c.id,
  user_id: c.userId || userId || currentUserId,
  name: c.name,
  phone: c.phone,
  document_id: c.documentId,
  address: c.address,
  created_at: c.createdAt,
  status: c.status
});

const fromDbClient = (row: any): Client => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  phone: row.phone,
  documentId: row.document_id,
  address: row.address,
  createdAt: row.created_at,
  status: row.status
});

const toDbLoan = (l: Loan, userId?: string) => ({
  id: l.id,
  user_id: l.userId || userId || currentUserId,
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
  userId: row.user_id,
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

const toDbInstallment = (i: Installment, userId?: string) => ({
  id: i.id,
  user_id: i.userId || userId || currentUserId,
  loan_id: i.loanId,
  client_id: i.clientId,
  client_name: i.clientName,
  number: i.number,
  amount: i.amount,
  capital_amount: i.capitalAmount,
  interest_amount: i.interestAmount,
  paid_amount: i.paidAmount ?? 0,
  paid_capital_amount: i.paidCapitalAmount ?? 0,
  paid_interest_amount: i.paidInterestAmount ?? 0,
  is_pactada: !!i.isPactada,
  pact_date: i.pactDate || null,
  pact_deadline: i.pactDeadline || null,
  waived_amount: i.waivedAmount ?? 0,
  due_date: i.dueDate,
  paid_date: i.paidDate || null,
  status: i.status
});

const toBaseDbInstallment = (i: Installment, userId?: string) => ({
  id: i.id,
  user_id: i.userId || userId || currentUserId,
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

const safeUpsertInstallments = async (installments: Installment[], userId?: string): Promise<void> => {
  if (installments.length === 0) return;
  const fullRows = installments.map(i => toDbInstallment(i, userId));
  const { error } = await supabase.from('installments').upsert(fullRows);
  if (error) {
    console.warn('Upsert extendido de installments falló, reintentando con esquema base:', error.message);
    const baseRows = installments.map(i => toBaseDbInstallment(i, userId));
    const { error: baseError } = await supabase.from('installments').upsert(baseRows);
    if (baseError) {
      console.error('Error definitivo al persistir cuotas en Supabase:', baseError);
      throw baseError;
    }
  }
};

const fromDbInstallment = (row: any): Installment => ({
  id: row.id,
  userId: row.user_id,
  loanId: row.loan_id,
  clientId: row.client_id,
  clientName: row.client_name,
  number: Number(row.number),
  amount: Number(row.amount),
  capitalAmount: Number(row.capital_amount),
  interestAmount: Number(row.interest_amount),
  paidAmount: row.paid_amount !== undefined && row.paid_amount !== null ? Number(row.paid_amount) : undefined,
  paidCapitalAmount: row.paid_capital_amount !== undefined && row.paid_capital_amount !== null ? Number(row.paid_capital_amount) : undefined,
  paidInterestAmount: row.paid_interest_amount !== undefined && row.paid_interest_amount !== null ? Number(row.paid_interest_amount) : undefined,
  isPactada: Boolean(row.is_pactada),
  pactDate: row.pact_date || undefined,
  pactDeadline: row.pact_deadline || undefined,
  waivedAmount: row.waived_amount !== undefined && row.waived_amount !== null ? Number(row.waived_amount) : undefined,
  dueDate: row.due_date,
  paidDate: row.paid_date || null,
  status: row.status
});

const toDbCapitalBox = (cb: CapitalBox, userId?: string) => {
  const uid = userId || cb.userId || currentUserId;
  return {
    id: cb.id || (uid ? `box_${uid}` : 'main_box'),
    user_id: uid,
    initial_capital: cb.initialCapital,
    current_capital: cb.currentCapital,
    total_lent: cb.totalLent,
    total_recovered: cb.totalRecovered,
    total_interest_recovered: cb.totalInterestRecovered
  };
};

const fromDbCapitalBox = (row: any): CapitalBox => ({
  id: row.id,
  userId: row.user_id,
  initialCapital: Number(row.initial_capital),
  currentCapital: Number(row.current_capital),
  totalLent: Number(row.total_lent),
  totalRecovered: Number(row.total_recovered),
  totalInterestRecovered: Number(row.total_interest_recovered)
});

const toDbTransaction = (t: CapitalTransaction, userId?: string) => ({
  id: t.id,
  user_id: t.userId || userId || currentUserId,
  amount: t.amount,
  type: t.type,
  description: t.description,
  date: t.date,
  reference_id: t.referenceId || null
});

const fromDbTransaction = (row: any): CapitalTransaction => ({
  id: row.id,
  userId: row.user_id,
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

  // Obtener ID del usuario autenticado
  async getAuthUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      currentUserId = session.user.id;
      return session.user.id;
    }
    return null;
  },

  // Obtener la suscripción del usuario actual
  async fetchUserSubscription(): Promise<UserSubscription | null> {
    const userId = await this.getAuthUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe registro, auto-crear prueba de 30 días
          const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: newSub, error: createErr } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              tier: 'free',
              status: 'trialing',
              trial_ends_at: trialEnd
            })
            .select()
            .single();

          if (createErr) {
            console.warn('Error al auto-crear suscripción:', createErr);
            return {
              id: 'local_sub',
              userId,
              tier: 'free',
              status: 'trialing',
              trialEndsAt: trialEnd
            };
          }

          return {
            id: newSub.id,
            userId: newSub.user_id,
            tier: newSub.tier,
            status: newSub.status,
            trialEndsAt: newSub.trial_ends_at,
            currentPeriodEnd: newSub.current_period_end
          };
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        tier: data.tier,
        status: data.status,
        trialEndsAt: data.trial_ends_at,
        currentPeriodEnd: data.current_period_end
      };
    } catch (err) {
      console.error('Error al obtener suscripción de Supabase:', err);
      // Fallback a trial local
      return {
        id: 'fallback_sub',
        userId,
        tier: 'free',
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
  },

  // Descargar datos de Supabase y actualizar localStorage del usuario
  async syncDown(onComplete?: () => void): Promise<boolean> {
    if (!this.isOnline()) {
      this.setStatus('offline');
      return false;
    }

    try {
      this.setStatus('syncing');
      const userId = await this.getAuthUserId();

      // Consultar clientes en Supabase (filtrados por RLS o user_id)
      let clientsQuery = supabase.from('clients').select('*');
      if (userId) clientsQuery = clientsQuery.eq('user_id', userId);
      const { data: clientsData, error: clientsErr } = await clientsQuery;
      if (clientsErr) throw clientsErr;

      // Descargar préstamos
      let loansQuery = supabase.from('loans').select('*');
      if (userId) loansQuery = loansQuery.eq('user_id', userId);
      const { data: loansData, error: loansErr } = await loansQuery;
      if (loansErr) throw loansErr;

      // Descargar cuotas
      let instQuery = supabase.from('installments').select('*');
      if (userId) instQuery = instQuery.eq('user_id', userId);
      const { data: instData, error: instErr } = await instQuery;
      if (instErr) throw instErr;

      // Descargar caja de capital
      let boxQuery = supabase.from('capital_box').select('*');
      if (userId) boxQuery = boxQuery.eq('user_id', userId);
      const { data: boxDataList, error: boxErr } = await boxQuery;
      if (boxErr) console.warn('Caja no encontrada en remote', boxErr);
      const boxData = boxDataList && boxDataList.length > 0 ? boxDataList[0] : null;

      // Descargar transacciones
      let txQuery = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (userId) txQuery = txQuery.eq('user_id', userId);
      const { data: txData, error: txErr } = await txQuery;
      if (txErr) throw txErr;

      // Mapear datos descargados
      const clients = (clientsData || []).map(fromDbClient);
      const loans = (loansData || []).map(fromDbLoan);
      const rawInstallments = (instData || []).map(fromDbInstallment);
      const transactions = (txData || []).map(fromDbTransaction);

      const loansMap = new Map<string, Loan>();
      loans.forEach(l => loansMap.set(l.id, l));

      // Asegurar que cuotas descargadas de esquemas base tengan su desglose coherente
      const installments = rawInstallments.map(inst => {
        const loan = loansMap.get(inst.loanId);
        const breakdown = getPaidBreakdownForInstallment(inst, loan);
        const origTotal = (loan && loan.installmentsCount > 0)
          ? Math.round((loan.totalToPay / loan.installmentsCount) * 100) / 100
          : inst.amount;

        const isPartialAbono = inst.status !== 'paid' && inst.amount < origTotal && inst.amount >= 0;

        return {
          ...inst,
          paidAmount: inst.paidAmount !== undefined ? inst.paidAmount : breakdown.paidTotal,
          paidCapitalAmount: inst.paidCapitalAmount !== undefined ? inst.paidCapitalAmount : breakdown.paidCapital,
          paidInterestAmount: inst.paidInterestAmount !== undefined ? inst.paidInterestAmount : breakdown.paidInterest,
          isPactada: inst.isPactada || isPartialAbono,
          pactDeadline: inst.pactDeadline || (isPartialAbono ? addMonths(inst.dueDate, 1) : undefined)
        };
      });

      const rawBox = boxData ? fromDbCapitalBox(boxData) : getLocal<CapitalBox>('capital', defaultBox);
      const capitalBox = computeCapitalBox(rawBox.initialCapital || 0, loans, installments, transactions);
      capitalBox.id = boxData?.id || rawBox.id || (userId ? `box_${userId}` : 'main_box');
      capitalBox.userId = userId || undefined;

      setLocal('clients', clients);
      setLocal('loans', loans);
      setLocal('installments', installments);
      setLocal('capital', capitalBox);
      setLocal('transactions', transactions);

      if (userId && !boxData) {
        // Solo registrar remotamente si aún no existía en Supabase
        supabase.from('capital_box').upsert(toDbCapitalBox(capitalBox, userId)).then();
      }

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

  // Subir todo el localStorage a Supabase (inicialización o importación de respaldo)
  async pushAllLocalToRemote(): Promise<void> {
    if (!this.isOnline()) return;

    try {
      const userId = await this.getAuthUserId();
      const clients = getLocal<Client[]>('clients', []).map(c => toDbClient(c, userId || undefined));
      const loans = getLocal<Loan[]>('loans', []).map(l => toDbLoan(l, userId || undefined));
      const installments = getLocal<Installment[]>('installments', []);
      const capitalBox = toDbCapitalBox(getLocal<CapitalBox>('capital', defaultBox), userId || undefined);
      const transactions = getLocal<CapitalTransaction[]>('transactions', []).map(t => toDbTransaction(t, userId || undefined));

      if (clients.length > 0) {
        const { error } = await supabase.from('clients').upsert(clients);
        if (error) console.error('Error en push clients:', error);
      }
      if (loans.length > 0) {
        const { error } = await supabase.from('loans').upsert(loans);
        if (error) console.error('Error en push loans:', error);
      }
      if (installments.length > 0) {
        await safeUpsertInstallments(installments, userId || undefined);
      }
      const { error: boxErr } = await supabase.from('capital_box').upsert(capitalBox);
      if (boxErr) console.error('Error en push capital_box:', boxErr);

      if (transactions.length > 0) {
        const { error: txErr } = await supabase.from('transactions').upsert(transactions);
        if (txErr) console.error('Error en push transactions:', txErr);
      }
    } catch (err) {
      console.error('Error en pushAllLocalToRemote:', err);
    }
  },

  // MUTACIONES ASÍNCRONAS EN SEGUNDO PLANO
  async syncUpClient(client: Client): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      const userId = await this.getAuthUserId();
      const { error } = await supabase.from('clients').upsert(toDbClient(client, userId || undefined));
      if (error) throw error;
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
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
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
      const userId = await this.getAuthUserId();
      const { error: loanErr } = await supabase.from('loans').upsert(toDbLoan(loan, userId || undefined));
      if (loanErr) throw loanErr;

      await safeUpsertInstallments(installments, userId || undefined);

      const { error: txErr } = await supabase.from('transactions').upsert(toDbTransaction(tx, userId || undefined));
      if (txErr) throw txErr;

      const { error: boxErr } = await supabase.from('capital_box').upsert(toDbCapitalBox(box, userId || undefined));
      if (boxErr) throw boxErr;

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
      const userId = await this.getAuthUserId();
      const { error: loanErr } = await supabase.from('loans').delete().eq('id', id);
      if (loanErr) throw loanErr;

      if (tx) {
        const { error: txErr } = await supabase.from('transactions').upsert(toDbTransaction(tx, userId || undefined));
        if (txErr) throw txErr;
      }
      if (box) {
        const { error: boxErr } = await supabase.from('capital_box').upsert(toDbCapitalBox(box, userId || undefined));
        if (boxErr) throw boxErr;
      }
      this.setStatus('synced');
    } catch (err) {
      console.error('Error deleteRemoteLoan:', err);
      this.setStatus('error');
    }
  },

  async syncUpPayment(inst: Installment | Installment[], loan: Loan, tx: CapitalTransaction, box: CapitalBox): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      const userId = await this.getAuthUserId();
      const installmentsList = Array.isArray(inst) ? inst : [inst];
      await safeUpsertInstallments(installmentsList, userId || undefined);

      const { error: loanErr } = await supabase.from('loans').upsert(toDbLoan(loan, userId || undefined));
      if (loanErr) throw loanErr;

      const { error: txErr } = await supabase.from('transactions').upsert(toDbTransaction(tx, userId || undefined));
      if (txErr) throw txErr;

      const { error: boxErr } = await supabase.from('capital_box').upsert(toDbCapitalBox(box, userId || undefined));
      if (boxErr) throw boxErr;

      this.setStatus('synced');
    } catch (err) {
      console.error('Error syncUpPayment en Supabase:', err);
      this.setStatus('error');
    }
  },

  async syncUpCapitalBox(box: CapitalBox, tx?: CapitalTransaction): Promise<void> {
    if (!this.isOnline()) return;
    try {
      this.setStatus('syncing');
      const userId = await this.getAuthUserId();
      const { error: boxErr } = await supabase.from('capital_box').upsert(toDbCapitalBox(box, userId || undefined));
      if (boxErr) throw boxErr;

      if (tx) {
        const { error: txErr } = await supabase.from('transactions').upsert(toDbTransaction(tx, userId || undefined));
        if (txErr) throw txErr;
      }
      this.setStatus('synced');
    } catch (err) {
      console.error('Error syncUpCapitalBox:', err);
      this.setStatus('error');
    }
  }
};
