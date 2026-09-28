import type { PaymentFrequency, Installment, Loan } from '../types';

/**
 * Interface para el resumen financiero consolidado
 */
export interface FinancialSummary {
  totalCapitalLent: number;       // Capital Prestado (volumen histórico)
  enCalle: number;                // En Calle (Capital principal pendiente de devolución en préstamos activos)
  totalPaidCapital: number;       // Capital recuperado cobrado
  totalPaidInterest: number;      // Interés recuperado cobrado
  totalRecovered: number;         // Total Recuperado (Capital + Interés cobrado)
  netProfit: number;              // Ganancia Neta (Intereses cobrados)
  pendingCapital: number;         // Capital por cobrar
  pendingInterest: number;        // Próximos intereses por cobrar
  totalPending: number;           // Pendiente total por cobrar
  overdueCapital: number;         // Capital en mora
  overdueInterest: number;        // Interés en mora
  totalOverdue: number;           // Total en mora
  overdueInstallmentsCount: number; // Cantidad de cuotas vencidas
}

/**
 * Calcula el desglose exacto de capital e interés pagado para una cuota (soporta abonos y sincronización sin columnas extra)
 */
export function getPaidBreakdownForInstallment(inst: Installment, loan?: Loan): { paidCapital: number; paidInterest: number; paidTotal: number } {
  // 1. Si la cuota ya tiene registrados de forma explícita paidCapitalAmount o paidInterestAmount
  if ((inst.paidCapitalAmount && inst.paidCapitalAmount > 0) || (inst.paidInterestAmount && inst.paidInterestAmount > 0)) {
    const paidCap = inst.paidCapitalAmount || 0;
    const paidInt = inst.paidInterestAmount || 0;
    const paidTot = (inst.paidAmount !== undefined && inst.paidAmount > 0) ? inst.paidAmount : (paidCap + paidInt);
    return { paidCapital: paidCap, paidInterest: paidInt, paidTotal: paidTot };
  }

  // 2. Si se tiene el paidAmount explícito registrado
  if (inst.paidAmount !== undefined && inst.paidAmount > 0) {
    const ratio = loan && loan.totalToPay > 0 ? loan.capital / loan.totalToPay : 0.8;
    const paidCap = Math.round(inst.paidAmount * ratio);
    const paidInt = inst.paidAmount - paidCap;
    return { paidCapital: paidCap, paidInterest: paidInt, paidTotal: inst.paidAmount };
  }

  // 3. Si la cuota está completamente pagada (status === 'paid')
  if (inst.status === 'paid') {
    if (loan && loan.installmentsCount > 0) {
      const origCap = Math.round((loan.capital / loan.installmentsCount) * 100) / 100;
      const origTotal = Math.round((loan.totalToPay / loan.installmentsCount) * 100) / 100;
      const origInt = Math.max(0, origTotal - origCap);
      return { paidCapital: origCap, paidInterest: origInt, paidTotal: origTotal };
    }
    const paidCap = inst.capitalAmount || 0;
    const paidInt = inst.interestAmount || 0;
    return { paidCapital: paidCap, paidInterest: paidInt, paidTotal: paidCap + paidInt };
  }

  // 4. Si la cuota es pending/overdue y viene de esquema base Supabase con saldo reducido (amount < origTotal)
  if (loan && loan.installmentsCount > 0) {
    const origTotal = Math.round((loan.totalToPay / loan.installmentsCount) * 100) / 100;
    const origCap = Math.round((loan.capital / loan.installmentsCount) * 100) / 100;
    if (inst.amount < origTotal && inst.amount >= 0) {
      const paidTot = origTotal - inst.amount;
      const paidCap = Math.max(0, origCap - inst.capitalAmount);
      const paidInt = Math.max(0, paidTot - paidCap);
      return { paidCapital: paidCap, paidInterest: paidInt, paidTotal: paidTot };
    }
  }

  return { paidCapital: 0, paidInterest: 0, paidTotal: 0 };
}

/**
 * Calcula el resumen financiero de forma precisa respetando abonos y pagos cobrados
 */
export function calculateFinancialSummary(loans: Loan[], installments: Installment[]): FinancialSummary {
  const loansMap = new Map<string, Loan>();
  loans.forEach(l => loansMap.set(l.id, l));

  // 1. Capital Prestado: suma del capital original emitido en préstamos
  const totalCapitalLent = loans.reduce((acc, curr) => acc + curr.capital, 0);

  let totalPaidCapital = 0;
  let totalPaidInterest = 0;
  let pendingCapital = 0;
  let pendingInterest = 0;
  let overdueCapital = 0;
  let overdueInterest = 0;
  let overdueInstallmentsCount = 0;

  installments.forEach(inst => {
    const loan = loansMap.get(inst.loanId);
    
    // Obtener desglose pagado de la cuota
    const { paidCapital, paidInterest } = getPaidBreakdownForInstallment(inst, loan);
    totalPaidCapital += paidCapital;
    totalPaidInterest += paidInterest;

    // Pendientes / en mora (cuotas no pagadas completamente)
    const isFullyPaid = (inst.status === 'paid' && !inst.isPactada) || inst.amount <= 0;
    if (!isFullyPaid) {
      pendingCapital += inst.capitalAmount;
      pendingInterest += inst.interestAmount;

      const isInstOverdue = isInstallmentOverdue(inst, loan);
      if (isInstOverdue) {
        overdueCapital += inst.capitalAmount;
        overdueInterest += inst.interestAmount;
        overdueInstallmentsCount += 1;
      }
    }
  });

  const totalRecovered = totalPaidCapital + totalPaidInterest;
  const netProfit = totalPaidInterest;
  const enCalle = pendingCapital;
  const totalPending = pendingCapital + pendingInterest;
  const totalOverdue = overdueCapital + overdueInterest;

  return {
    totalCapitalLent,
    enCalle,
    totalPaidCapital,
    totalPaidInterest,
    totalRecovered,
    netProfit,
    pendingCapital,
    pendingInterest,
    totalPending,
    overdueCapital,
    overdueInterest,
    totalOverdue,
    overdueInstallmentsCount
  };
}

/**
 * Añade días a una fecha (formato YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00'); // Evitar problemas de zona horaria
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Añade meses a una fecha (formato YYYY-MM-DD)
 */
export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

/**
 * Determina si una fecha es domingo (0 = domingo)
 */
export function isSunday(dateStr: string): boolean {
  const date = new Date(dateStr + 'T12:00:00');
  return date.getDay() === 0;
}

/**
 * Obtiene la siguiente fecha de cobro válida (omitiendo domingos si es cobro diario)
 */
export function getNextPaymentDate(currentDateStr: string, frequency: PaymentFrequency): string {
  let nextDate = currentDateStr;
  
  if (frequency === 'daily') {
    nextDate = addDays(currentDateStr, 1);
    // Si cae domingo, se salta al lunes
    if (isSunday(nextDate)) {
      nextDate = addDays(nextDate, 1);
    }
  } else if (frequency === 'weekly') {
    nextDate = addDays(currentDateStr, 7);
  } else if (frequency === 'biweekly') {
    nextDate = addDays(currentDateStr, 14);
  } else if (frequency === 'monthly') {
    nextDate = addMonths(currentDateStr, 1);
  }
  
  return nextDate;
}

/**
 * Retorna la descripción amigable del periodo de extensión/renovación
 */
export function getRenewalStepLabel(frequency: PaymentFrequency): string {
  switch (frequency) {
    case 'daily':
      return '1 día hábil';
    case 'weekly':
      return '1 semana (7 días)';
    case 'biweekly':
      return '1 quincena (14 días)';
    case 'monthly':
    default:
      return '1 mes';
  }
}

/**
 * Genera la tabla de amortización para un préstamo
 */
export function generateInstallments(params: {
  loanId: string;
  clientId: string;
  clientName: string;
  capital: number;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  installmentsCount: number;
  startDate: string;
}): Installment[] {
  const { loanId, clientId, clientName, capital, interestRate, paymentFrequency, installmentsCount, startDate } = params;
  
  const totalInterest = (capital * interestRate) / 100;
  const totalToPay = capital + totalInterest;
  
  // Montos base redondeados a 2 decimales (o enteros en el caso de pesos colombianos)
  const baseAmount = Math.round((totalToPay / installmentsCount) * 100) / 100;
  const baseCapital = Math.round((capital / installmentsCount) * 100) / 100;
  const baseInterest = Math.round((totalInterest / installmentsCount) * 100) / 100;
  
  const installments: Installment[] = [];
  let accumulatedAmount = 0;
  let accumulatedCapital = 0;
  let accumulatedInterest = 0;
  
  let currentPaymentDate = startDate;
  
  for (let i = 1; i <= installmentsCount; i++) {
    currentPaymentDate = getNextPaymentDate(currentPaymentDate, paymentFrequency);
    
    let amount = baseAmount;
    let capitalAmount = baseCapital;
    let interestAmount = baseInterest;
    
    // Ajuste en la última cuota para evitar diferencias de redondeo
    if (i === installmentsCount) {
      amount = Math.round((totalToPay - accumulatedAmount) * 100) / 100;
      capitalAmount = Math.round((capital - accumulatedCapital) * 100) / 100;
      interestAmount = Math.round((totalInterest - accumulatedInterest) * 100) / 100;
    } else {
      accumulatedAmount += amount;
      accumulatedCapital += capitalAmount;
      accumulatedInterest += interestAmount;
    }
    
    installments.push({
      id: `${loanId}-c${i}`,
      loanId,
      clientId,
      clientName,
      number: i,
      amount,
      capitalAmount,
      interestAmount,
      paidAmount: 0,
      paidCapitalAmount: 0,
      paidInterestAmount: 0,
      dueDate: currentPaymentDate,
      paidDate: null,
      status: 'pending'
    });
  }
  
  return installments;
}

/**
 * Formatea un número como moneda local (Peso Colombiano por defecto)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Compara dos fechas (formato YYYY-MM-DD) para determinar el estado de mora
 */
export function isOverdue(dueDateStr: string): boolean {
  const todayStr = new Date().toISOString().split('T')[0];
  return dueDateStr < todayStr;
}

/**
 * Determina si una cuota específica está vencida considerando el plazo de cuotas pactadas y el estado del préstamo
 */
export function isInstallmentOverdue(inst: Installment, loan?: Loan): boolean {
  if (inst.amount <= 0 || (inst.status === 'paid' && !inst.isPactada)) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  if (inst.isPactada) {
    const deadline = inst.pactDeadline || addMonths(inst.dueDate, 1);
    return todayStr > deadline;
  }
  if (inst.status === 'overdue' || inst.dueDate < todayStr) return true;
  if (loan && (loan.status === 'overdue' || (loan.endDate && loan.endDate < todayStr && loan.status !== 'completed'))) {
    return true;
  }
  return false;
}

/**
 * Obtiene el estado efectivo de una cuota: 'paid', 'pactada' (acuerdo vigente sin mora), 'overdue' (mora) o 'pending'
 */
export function getInstallmentEffectiveStatus(inst: Installment, loan?: Loan): 'pending' | 'paid' | 'overdue' | 'pactada' {
  if (inst.amount <= 0 || (inst.status === 'paid' && !inst.isPactada)) return 'paid';
  const todayStr = new Date().toISOString().split('T')[0];
  if (inst.isPactada) {
    const deadline = inst.pactDeadline || addMonths(inst.dueDate, 1);
    if (todayStr > deadline) return 'overdue';
    return 'pactada';
  }
  if (inst.status === 'overdue' || inst.dueDate < todayStr) return 'overdue';
  if (loan && (loan.status === 'overdue' || (loan.endDate && loan.endDate < todayStr && loan.status !== 'completed'))) {
    return 'overdue';
  }
  return 'pending';
}

