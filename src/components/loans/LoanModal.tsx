import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Client, PaymentFrequency, Loan } from '../../types';
import { formatCurrency } from '../../services/loanCalculator';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSave: (loanData: Omit<Loan, 'id' | 'totalToPay' | 'endDate' | 'status'>) => void;
  defaultClientId?: string; // Por si se crea desde la ficha del cliente
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose, clients, onSave, defaultClientId }) => {
  const [clientId, setClientId] = useState('');
  const [capital, setCapital] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number>(20); // Default 20%
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClientId(defaultClientId || (clients[0]?.id || ''));
      setCapital('');
      setInterestRate(20);
      setPaymentFrequency('monthly');
      setInstallmentsCount(1);
      setStartDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, defaultClientId, clients]);

  // Autoconfigurar cuotas sugeridas según frecuencia
  useEffect(() => {
    if (paymentFrequency === 'daily') setInstallmentsCount(24); // Ej. 24 cuotas diarias
    else if (paymentFrequency === 'weekly') setInstallmentsCount(5);
    else if (paymentFrequency === 'biweekly') setInstallmentsCount(2);
    else if (paymentFrequency === 'monthly') setInstallmentsCount(1);
  }, [paymentFrequency]);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentFrequency(e.target.value as PaymentFrequency);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Debe seleccionar un cliente.');
      return;
    }
    if (!capital || capital <= 0) {
      setError('Debe ingresar un capital mayor a 0.');
      return;
    }
    if (interestRate < 0) {
      setError('La tasa de interés no puede ser negativa.');
      return;
    }
    if (installmentsCount <= 0) {
      setError('Debe ingresar un número de cuotas mayor a 0.');
      return;
    }
    if (!startDate) {
      setError('Debe ingresar la fecha de inicio.');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) {
      setError('Cliente no encontrado.');
      return;
    }

    onSave({
      clientId,
      clientName: client.name,
      capital,
      interestRate,
      paymentFrequency,
      installmentsCount,
      startDate
    });
    onClose();
  };

  // Cálculos en tiempo real para vista previa
  const numCapital = Number(capital) || 0;
  const totalInterest = (numCapital * interestRate) / 100;
  const totalToPay = numCapital + totalInterest;
  const installmentAmount = installmentsCount > 0 ? totalToPay / installmentsCount : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Préstamo"
    >
      <form onSubmit={handleSubmit} className="loan-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="loan-client">Seleccionar Cliente</label>
          <select
            id="loan-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="" disabled>Seleccione un cliente...</option>
            {clients.filter(c => c.status === 'active').map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.documentId}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="loan-capital">Capital Prestado ($)</label>
            <input
              id="loan-capital"
              type="number"
              placeholder="Ej. 1000000"
              value={capital}
              onChange={(e) => setCapital(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="loan-interest">Interés (%)</label>
            <input
              id="loan-interest"
              type="number"
              placeholder="Ej. 20"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="loan-frequency">Frecuencia de Pago</label>
            <select
              id="loan-frequency"
              value={paymentFrequency}
              onChange={handleFrequencyChange}
            >
              <option value="daily">Diario (sin domingos)</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <div className="form-group flex-1">
            <label htmlFor="loan-installments">Número de Cuotas</label>
            <input
              id="loan-installments"
              type="number"
              min="1"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="loan-start-date">Fecha de Desembolso</label>
          <input
            id="loan-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* Vista previa en tiempo real */}
        {numCapital > 0 && (
          <div className="loan-preview animate-scale-in">
            <h4 className="preview-title">Resumen de Cuotas</h4>
            <div className="preview-grid">
              <div className="preview-item">
                <span className="preview-label">Intereses Ganados:</span>
                <span className="preview-value success">{formatCurrency(totalInterest)}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Total a Cobrar:</span>
                <span className="preview-value">{formatCurrency(totalToPay)}</span>
              </div>
              <div className="preview-item col-span-2 highlight">
                <span className="preview-label">Valor por Cuota:</span>
                <span className="preview-value font-large">{formatCurrency(installmentAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="form-submit-btn">
          Crear y Desembolsar Préstamo
        </button>
      </form>

      <style>{`
        .loan-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-error {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          border-left: 3px solid var(--danger);
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .flex-1 {
          flex: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px;
        }

        .form-group input:focus, .form-group select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }

        .loan-preview {
          background-color: var(--bg-app);
          border-radius: 12px;
          padding: 14px;
          border: 1px dashed var(--border-color);
        }

        .preview-title {
          font-size: 14px;
          margin-bottom: 10px;
          color: var(--text-primary);
        }

        .preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .preview-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .preview-label {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .preview-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .preview-value.success {
          color: var(--success);
        }

        .col-span-2 {
          grid-column: span 2;
        }

        .preview-item.highlight {
          margin-top: 4px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
        }

        .font-large {
          font-size: 18px;
          color: var(--primary);
        }

        .form-submit-btn {
          margin-top: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          color: white;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 4px 10px rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </Modal>
  );
};
