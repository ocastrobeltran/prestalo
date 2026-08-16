export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Client {
  id: string;
  name: string;
  phone: string;
  documentId: string;
  address: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Loan {
  id: string;
  clientId: string;
  clientName: string;
  capital: number;             // Capital prestado original (ej: $1.000.000)
  interestRate: number;        // Tasa de interés en porcentaje (ej: 20)
  totalToPay: number;          // Total a pagar (Capital + Intereses, ej: $1.200.000)
  paymentFrequency: PaymentFrequency;
  installmentsCount: number;   // Número de cuotas totales
  startDate: string;           // Fecha de inicio (YYYY-MM-DD)
  endDate: string;             // Fecha de vencimiento (YYYY-MM-DD)
  status: 'active' | 'completed' | 'overdue';
}

export interface Installment {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  number: number;              // Número de la cuota (ej: 1, 2, 3...)
  amount: number;              // Monto restante de la cuota por pagar
  capitalAmount: number;       // Parte restante del capital
  interestAmount: number;      // Parte restante del interés
  paidAmount?: number;         // Monto ya cobrado de esta cuota (incluye abonos parciales)
  paidCapitalAmount?: number;  // Capital ya cobrado de esta cuota
  paidInterestAmount?: number; // Interés ya cobrado de esta cuota
  dueDate: string;             // Fecha de vencimiento (YYYY-MM-DD)
  paidDate: string | null;     // Fecha de pago (null si no está pagada)
  status: 'pending' | 'paid' | 'overdue';
}

export interface CapitalBox {
  initialCapital: number;      // Mi capital inicial configurado
  currentCapital: number;      // Capital disponible en caja para prestar
  totalLent: number;           // Capital actual prestado y en la calle
  totalRecovered: number;      // Capital recuperado total (sin intereses)
  totalInterestRecovered: number; // Intereses cobrados totales
}

export interface CapitalTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense' | 'initial' | 'loan_disbursement' | 'installment_payment';
  description: string;
  date: string;                // YYYY-MM-DD HH:mm:ss
  referenceId?: string;        // ID del préstamo o cliente relacionado
}
