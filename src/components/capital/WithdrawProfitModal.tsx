import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Sparkles, AlertCircle, ArrowDownRight, CheckCircle2, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../../services/loanCalculator';

export interface WithdrawProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProfit: number;
  totalProfit: number;
  withdrawnProfit: number;
  currentCapital: number;
  onConfirmWithdraw: (amount: number, note?: string) => Promise<void> | void;
}

export const WithdrawProfitModal: React.FC<WithdrawProfitModalProps> = ({
  isOpen,
  onClose,
  availableProfit,
  totalProfit,
  withdrawnProfit,
  currentCapital,
  onConfirmWithdraw
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // El monto máximo que se puede retirar es el mínimo entre lo ganado disponible y lo que realmente hay en caja
  const maxRetirable = Math.max(0, Math.min(availableProfit, currentCapital));

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNote('');
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validaciones en vivo
  const numericAmount = amount === '' ? 0 : Number(amount);
  const isAmountZeroOrNegative = amount !== '' && numericAmount <= 0;
  const exceedsAvailableProfit = numericAmount > availableProfit;
  const exceedsCapitalInBox = numericAmount > currentCapital;
  const isFormValid = numericAmount > 0 && !exceedsAvailableProfit && !exceedsCapitalInBox;

  const handleQuickPercent = (percent: number) => {
    if (maxRetirable <= 0) return;
    const calculated = Math.floor((maxRetirable * percent) / 100);
    setAmount(calculated);
    setError(null);
  };

  const handleMaxAll = () => {
    if (maxRetirable <= 0) return;
    setAmount(maxRetirable);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount || numericAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (exceedsAvailableProfit) {
      setError(`El monto supera la ganancia neta disponible (${formatCurrency(availableProfit)}).`);
      return;
    }

    if (exceedsCapitalInBox) {
      setError(`No hay suficiente dinero disponible en caja (${formatCurrency(currentCapital)}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmWithdraw(numericAmount, note.trim() || undefined);
      setSuccessMessage('¡Retiro de ganancias realizado exitosamente!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al procesar el retiro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-withdraw-title">
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-title-icon withdraw-icon">
              <ArrowDownRight size={22} className="icon-emerald" />
            </div>
            <div>
              <h3 id="modal-withdraw-title">Retirar Ganancias</h3>
              <p className="modal-subtitle">Transferir ganancias netas a uso personal o externo</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Resumen de Fondos Disponibles */}
          <div className="funds-overview-card">
            <div className="funds-primary-highlight">
              <div className="funds-badge">
                <Sparkles size={13} />
                <span>Ganancia Disponible</span>
              </div>
              <div className="funds-main-amount">
                {formatCurrency(availableProfit)}
              </div>
              <p className="funds-main-desc">
                Disponible para retirar de tus intereses efectivamente cobrados.
              </p>
            </div>

            <div className="funds-secondary-grid">
              <div className="funds-sub-item">
                <span className="funds-sub-label">Total Ganado:</span>
                <span className="funds-sub-val font-semibold">{formatCurrency(totalProfit)}</span>
              </div>
              <div className="funds-sub-item">
                <span className="funds-sub-label">Ya Retirado:</span>
                <span className="funds-sub-val font-semibold text-muted">{formatCurrency(withdrawnProfit)}</span>
              </div>
              <div className="funds-sub-item box-capacity">
                <span className="funds-sub-label flex-inline-gap">
                  <Wallet size={12} className="icon-blue" />
                  Saldo en Caja:
                </span>
                <span className={`funds-sub-val font-semibold ${currentCapital < availableProfit ? 'text-amber' : ''}`}>
                  {formatCurrency(currentCapital)}
                </span>
              </div>
            </div>
          </div>

          {/* Advertencia si la caja tiene menos dinero que la ganancia disponible */}
          {currentCapital < availableProfit && availableProfit > 0 && (
            <div className="box-warning-banner">
              <AlertCircle size={16} className="text-amber flex-shrink-0" />
              <span>
                La caja dispone de <strong>{formatCurrency(currentCapital)}</strong>. Aunque tu ganancia contable disponible es {formatCurrency(availableProfit)}, solo puedes retirar hasta el saldo líquido en caja.
              </span>
            </div>
          )}

          {/* Si no hay ganancia disponible o no hay dinero en caja */}
          {maxRetirable <= 0 ? (
            <div className="empty-funds-notice">
              <PiggyBank size={36} className="text-muted" />
              <h4>No hay fondos disponibles para retiro</h4>
              <p>
                {availableProfit <= 0
                  ? 'Aún no has cobrado ganancias de intereses o ya has retirado la totalidad de las mismas.'
                  : 'No dispones de liquidez suficiente en la caja de capital para efectuar un retiro en este momento.'}
              </p>
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-secondary w-full" onClick={onClose}>
                  Entendido
                </button>
              </div>
            </div>
          ) : (
            /* Formulario de Retiro */
            <form onSubmit={handleSubmit} className="withdraw-form">
              <div className="form-group">
                <label htmlFor="withdraw-amount">
                  Monto a Retirar
                </label>
                <div className="input-with-icon">
                  <span className="input-currency-prefix">
                    <DollarSign size={18} />
                  </span>
                  <input
                    id="withdraw-amount"
                    type="number"
                    min="1"
                    max={maxRetirable}
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setAmount(val);
                      setError(null);
                    }}
                    placeholder={`Máximo ${formatCurrency(maxRetirable)}`}
                    autoFocus
                    required
                  />
                </div>

                {/* Botones de atajo rápido */}
                <div className="quick-percentages-row">
                  <button
                    type="button"
                    className="quick-pct-btn"
                    onClick={() => handleQuickPercent(25)}
                    disabled={maxRetirable <= 0}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    className="quick-pct-btn"
                    onClick={() => handleQuickPercent(50)}
                    disabled={maxRetirable <= 0}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    className="quick-pct-btn"
                    onClick={() => handleQuickPercent(75)}
                    disabled={maxRetirable <= 0}
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    className="quick-pct-btn highlight"
                    onClick={handleMaxAll}
                    disabled={maxRetirable <= 0}
                  >
                    100% (Todo)
                  </button>
                </div>

                {/* Mensajes de validación visual inmediata */}
                <div className="validation-helper">
                  {isAmountZeroOrNegative && (
                    <span className="validation-msg text-danger flex-inline-gap">
                      <AlertCircle size={13} /> El monto debe ser mayor a 0.
                    </span>
                  )}
                  {exceedsAvailableProfit && (
                    <span className="validation-msg text-danger flex-inline-gap">
                      <AlertCircle size={13} /> Supera la ganancia disponible ({formatCurrency(availableProfit)}).
                    </span>
                  )}
                  {!exceedsAvailableProfit && exceedsCapitalInBox && (
                    <span className="validation-msg text-danger flex-inline-gap">
                      <AlertCircle size={13} /> Supera el saldo en caja ({formatCurrency(currentCapital)}).
                    </span>
                  )}
                  {numericAmount > 0 && !exceedsAvailableProfit && !exceedsCapitalInBox && (
                    <span className="validation-msg text-emerald flex-inline-gap">
                      <CheckCircle2 size={13} /> Monto válido para retiro. Quedará en ganancia: {formatCurrency(availableProfit - numericAmount)}.
                    </span>
                  )}
                </div>
              </div>

              {/* Motivo o Destino del Dinero */}
              <div className="form-group">
                <label htmlFor="withdraw-note">
                  Motivo / Destino del Dinero <span className="label-optional">(Opcional)</span>
                </label>
                <input
                  id="withdraw-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej. Gastos personales, Ahorro, Emergencia familiar..."
                  maxLength={90}
                />
                <span className="field-hint">
                  Este detalle quedará registrado en el historial de transacciones de capital.
                </span>
              </div>

              {/* Feedback Error / Éxito */}
              {error && (
                <div className="error-banner animate-slide-up" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="success-banner animate-slide-up" role="status">
                  <CheckCircle2 size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-confirm-withdraw"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 250;
          padding: 16px;
          padding-top: max(16px, env(safe-area-inset-top));
          padding-right: max(16px, env(safe-area-inset-right));
          padding-bottom: max(16px, env(safe-area-inset-bottom));
          padding-left: max(16px, env(safe-area-inset-left));
        }

        .modal-content {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          max-height: 90dvh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-card);
          flex-shrink: 0;
        }

        .modal-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .modal-title-icon {
          padding: 8px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-title-icon.withdraw-icon {
          background-color: rgba(16, 185, 129, 0.12) !important;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.25;
        }

        .modal-subtitle {
          font-size: 12.5px;
          color: var(--text-secondary);
          margin-top: 2px;
          line-height: 1.35;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.15s ease, color 0.15s ease;
          flex-shrink: 0;
        }

        .close-btn:hover {
          color: var(--text-primary);
          background-color: var(--bg-app);
        }

        .close-btn:focus-visible {
          outline: 2px solid var(--primary);
        }

        .modal-body-scroll {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          display: flex;
          flex-direction: column;
        }

        .icon-emerald {
          color: #10b981;
        }

        .text-emerald {
          color: #059669;
        }

        :global(.dark) .text-emerald {
          color: #10b981;
        }

        .text-danger {
          color: var(--danger);
        }

        .icon-blue {
          color: var(--primary);
        }

        .text-amber {
          color: var(--warning);
        }

        .text-muted {
          color: var(--text-secondary);
        }

        .flex-shrink-0 {
          flex-shrink: 0;
        }

        .font-semibold {
          font-weight: 600;
        }

        .funds-overview-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%);
          border-bottom: 1px solid var(--border-color);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }

        .funds-primary-highlight {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
        }

        .funds-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #059669;
          background: rgba(16, 185, 129, 0.15);
          padding: 3px 10px;
          border-radius: 20px;
        }

        :global(.dark) .funds-badge {
          color: #10b981;
        }

        .funds-main-amount {
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 800;
          color: #059669;
          letter-spacing: -0.5px;
          line-height: 1.15;
        }

        :global(.dark) .funds-main-amount {
          color: #10b981;
        }

        .funds-main-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          margin: 0;
          max-width: 320px;
          line-height: 1.35;
        }

        .funds-secondary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 10px 12px;
        }

        .funds-sub-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .funds-sub-label {
          font-size: 10.5px;
          color: var(--text-tertiary);
          font-weight: 600;
        }

        .funds-sub-val {
          font-size: 12.5px;
          color: var(--text-primary);
        }

        .funds-sub-val.text-muted {
          color: var(--text-secondary);
        }

        .funds-sub-val.text-amber {
          color: var(--warning);
        }

        .flex-inline-gap {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .box-warning-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(var(--warning-rgb), 0.12);
          border: 1px solid rgba(var(--warning-rgb), 0.3);
          border-radius: 10px;
          padding: 10px 14px;
          margin: 12px 16px 0;
          font-size: 11.5px;
          color: var(--text-primary);
          line-height: 1.4;
          flex-shrink: 0;
        }

        .empty-funds-notice {
          padding: 32px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          flex: 1;
          justify-content: center;
        }

        .empty-funds-notice h4 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .empty-funds-notice p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          max-width: 340px;
          line-height: 1.4;
        }

        .withdraw-form {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .withdraw-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .withdraw-form label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .label-optional {
          font-size: 11px;
          font-weight: normal;
          color: var(--text-tertiary);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-currency-prefix {
          position: absolute;
          left: 14px;
          color: var(--text-tertiary);
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .input-with-icon input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 38px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 17px;
          font-weight: 700;
          font-family: var(--font-heading);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-with-icon input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .quick-percentages-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 6px;
        }

        .quick-pct-btn {
          min-height: 38px;
          padding: 8px 4px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-app);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: nowrap;
        }

        .quick-pct-btn:hover:not(:disabled) {
          border-color: #10b981;
          color: #059669;
          background: rgba(16, 185, 129, 0.08);
        }

        .quick-pct-btn.highlight {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border-color: rgba(16, 185, 129, 0.3);
        }

        :global(.dark) .quick-pct-btn.highlight {
          color: #10b981;
        }

        .quick-pct-btn.highlight:hover:not(:disabled) {
          background: #10b981;
          color: white;
        }

        .quick-pct-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .validation-helper {
          min-height: 18px;
          margin-top: 3px;
        }

        .validation-msg {
          font-size: 11px;
          font-weight: 500;
          line-height: 1.35;
        }

        .withdraw-form input[type="text"] {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .withdraw-form input[type="text"]:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.15);
        }

        .field-hint {
          font-size: 10.5px;
          color: var(--text-tertiary);
          margin-top: 2px;
          line-height: 1.3;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(var(--danger-rgb), 0.1);
          border: 1px solid rgba(var(--danger-rgb), 0.3);
          color: var(--danger);
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 500;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #059669;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .btn-secondary {
          flex: 1;
          height: 48px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: var(--bg-app);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-card);
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-confirm-withdraw {
          flex: 1.5;
          height: 48px;
          padding: 0 18px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }

        .btn-confirm-withdraw:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45);
        }

        .btn-confirm-withdraw:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-confirm-withdraw:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .w-full {
          width: 100%;
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 10px;
          }

          .modal-content {
            max-height: 92vh;
            max-height: 92dvh;
          }

          .modal-header {
            padding: 14px 16px;
          }

          .funds-overview-card {
            padding: 14px 16px;
          }

          .funds-secondary-grid {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .funds-sub-item {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
            border-bottom: 1px dashed var(--border-color);
          }

          .funds-sub-item:last-child {
            border-bottom: none;
          }

          .withdraw-form {
            padding: 14px 16px;
          }

          .quick-percentages-row {
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
          }

          .quick-pct-btn {
            font-size: 11px;
            min-height: 36px;
            padding: 6px 2px;
          }

          .modal-actions {
            flex-direction: column-reverse;
            gap: 8px;
          }

          .btn-secondary,
          .btn-confirm-withdraw {
            width: 100%;
            height: 48px;
          }
        }

        @media (max-width: 360px) {
          .quick-percentages-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
