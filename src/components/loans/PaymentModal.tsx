import React, { useState, useEffect } from 'react';
import type { Installment } from '../../types';
import { formatCurrency } from '../../services/loanCalculator';
import { X, DollarSign, Calendar, User, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  onConfirmPayment: (installmentId: string, amount: number, isPactada?: boolean) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
  onConfirmPayment
}) => {
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [isPactada, setIsPactada] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (installment) {
      setPaymentAmount(installment.amount);
      setIsPactada(false);
      setError(null);
    }
  }, [installment]);

  if (!isOpen || !installment) return null;

  const isPartial = paymentAmount !== '' && Number(paymentAmount) < installment.amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount === '' || paymentAmount <= 0) {
      setError('Por favor ingrese un monto válido mayor a 0.');
      return;
    }

    onConfirmPayment(installment.id, Number(paymentAmount), isPartial && isPactada);
    onClose();
  };

  const handleFullPaymentClick = () => {
    setPaymentAmount(installment.amount);
    setIsPactada(false);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <DollarSign className="modal-title-icon text-success" size={22} />
            <div>
              <h3>Registrar Pago / Abono</h3>
              <p className="modal-subtitle">Cuota #{installment.number} · {installment.clientName}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="payment-summary-card">
            <div className="summary-row">
              <span className="summary-lbl"><User size={14} /> Cliente:</span>
              <span className="summary-val font-semibold">{installment.clientName}</span>
            </div>
            <div className="summary-row">
              <span className="summary-lbl"><Calendar size={14} /> Vencimiento:</span>
              <span className="summary-val">{installment.dueDate}</span>
            </div>
            <div className="summary-row border-top">
              <span className="summary-lbl font-semibold">Valor Sugerido/Pendiente:</span>
              <span className="summary-val text-primary font-bold">{formatCurrency(installment.amount)}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="paymentAmount">Monto a Abonar / Pagar ($)</label>
            <div className="input-with-action">
              <input
                id="paymentAmount"
                type="number"
                step="any"
                min="1"
                value={paymentAmount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setPaymentAmount(val);
                  if (val !== '' && val >= installment.amount) {
                    setIsPactada(false);
                  }
                }}
                placeholder="Ej. 50000"
                autoFocus
                required
              />
              <button 
                type="button" 
                className="full-pay-quick-btn"
                onClick={handleFullPaymentClick}
                title="Pagar cuota completa"
              >
                Cuota Completa
              </button>
            </div>
            
            {/* Opción para Pactar Cuota cuando el monto es menor */}
            {isPartial && (
              <div className={`pacto-card ${isPactada ? 'active' : ''} animate-slide-up`}>
                <label className="pacto-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPactada}
                    onChange={(e) => setIsPactada(e.target.checked)}
                    className="pacto-checkbox"
                  />
                  <div className="pacto-text-wrap">
                    <span className="pacto-title">
                      🤝 Pactar cuota como cumplida
                    </span>
                    <span className="pacto-desc">
                      {isPactada ? (
                        <strong>
                          ✨ Se acepta este pago de {formatCurrency(Number(paymentAmount))} como liquidación total de la cuota. NO quedará saldo pendiente ni entrará en mora.
                        </strong>
                      ) : (
                        `Marque esta casilla si acordó con el cliente recibir ${formatCurrency(Number(paymentAmount))} dando la cuota por pagada (sin generar mora por el faltante).`
                      )}
                    </span>
                  </div>
                </label>
              </div>
            )}

            <small className="help-text">
              {isPartial && !isPactada ? (
                <span className="text-warning">
                  ⚠️ Abono parcial estándar: La cuota mantendrá un saldo pendiente de {formatCurrency(installment.amount - Number(paymentAmount))} que vencerá en la fecha pactada.
                </span>
              ) : paymentAmount !== '' && Number(paymentAmount) > installment.amount ? (
                <span className="text-success">
                  ✨ Abono mayor: Cubre la cuota actual y el excedente se abonará al préstamo.
                </span>
              ) : !isPartial ? (
                'Puedes modificar este valor si el cliente realiza un abono parcial o mayor.'
              ) : null}
            </small>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`btn-primary ${isPactada ? 'pactada-btn' : 'success-btn'}`}>
              <CheckCircle size={18} />
              {isPactada ? 'Confirmar Pago Pactado' : 'Confirmar Pago'} ({formatCurrency(Number(paymentAmount) || 0)})
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }

        .modal-content {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          width: 100%;
          max-width: 440px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .modal-title-icon {
          padding: 8px;
          background-color: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .modal-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-app);
        }

        .modal-form {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .payment-summary-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .summary-row.border-top {
          border-top: 1px dashed var(--border-color);
          padding-top: 8px;
          margin-top: 2px;
        }

        .summary-lbl {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .summary-val {
          color: var(--text-primary);
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

        .input-with-action {
          display: flex;
          gap: 8px;
        }

        .input-with-action input {
          flex: 1;
          padding: 10px 14px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-container);
          color: var(--text-primary);
        }

        .full-pay-quick-btn {
          padding: 0 12px;
          font-size: 12px;
          font-weight: 600;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--primary);
          border-radius: 10px;
          white-space: nowrap;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .full-pay-quick-btn:hover {
          background-color: rgba(14, 165, 233, 0.1);
        }

        .help-text {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }

        .error-banner {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .btn-secondary {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-app);
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
        }

        .btn-primary {
          flex: 2;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background-color: var(--primary);
          color: white;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .pacto-card {
          margin-top: 10px;
          padding: 12px;
          border-radius: 12px;
          background-color: var(--bg-app);
          border: 1.5px dashed rgba(14, 165, 233, 0.4);
          transition: all 0.2s ease;
        }

        .pacto-card.active {
          background-color: rgba(16, 185, 129, 0.08);
          border: 1.5px solid #10b981;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
        }

        .pacto-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .pacto-checkbox {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          cursor: pointer;
          accent-color: #10b981;
        }

        .pacto-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pacto-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .pacto-desc {
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .pactada-btn {
          background: linear-gradient(135deg, #10b981, #0284c7) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .pactada-btn:hover {
          opacity: 0.95;
        }

        .success-btn {
          background-color: #10b981 !important;
        }

        .success-btn:hover {
          background-color: #059669 !important;
        }
      `}</style>
    </div>
  );
};
