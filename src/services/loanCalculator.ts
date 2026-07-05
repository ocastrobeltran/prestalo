import type { PaymentFrequency, Installment } from '../types';

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
