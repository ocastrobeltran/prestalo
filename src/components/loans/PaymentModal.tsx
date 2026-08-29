import React, { useState, useEffect } from 'react';
import type { Installment, Loan } from '../../types';
import { formatCurrency, addMonths, getNextPaymentDate, getRenewalStepLabel } from '../../services/loanCalculator';
import { X, DollarSign, Calendar, User, CheckCircle, Clock, RotateCcw, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  loan?: Loan | null;
  onConfirmPayment: (installmentId: string, amount: number, isPactada?: boolean) => void;
  onConfirmRenewal?: (installmentId: string, interestAmount: number) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  installment,
  loan: propLoan,
  onConfirmPayment,
  onConfirmRenewal
}) => {
  const [modalMode, setModalMode] = useState<'abono' | 'renovacion'>('abono');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [renewalInterestAmount, setRenewalInterestAmount] = useState<number | ''>('');
  const [isPactada, setIsPactada] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener el préstamo asociado si no viene como prop
  const currentLoan = propLoan || (installment ? storageService.getLoans().find(l => l.id === installment.loanId) : null);
  const frequency = currentLoan?.paymentFrequency || 'monthly';
  const renewalStepLabel = getRenewalStepLabel(frequency);

  // Calcular el interés estimado para el periodo
  const defaultPeriodInterest = installment 
    ? (installment.interestAmount > 0 
        ? installment.interestAmount 
        : (currentLoan ? Math.round((currentLoan.capital * currentLoan.interestRate) / (100 * currentLoan.installmentsCount)) : 0))
    : 0;

  useEffect(() => {
    if (installment) {
      setPaymentAmount(installment.amount);
      setRenewalInterestAmount(defaultPeriodInterest);
      setIsPactada(!!installment.isPactada);
      setError(null);
      setModalMode('abono');
    }
  }, [installment]);

  if (!isOpen || !installment) return null;

  const isPartial = paymentAmount !== '' && Number(paymentAmount) < installment.amount;
  const deadlineDate = installment.pactDeadline || addMonths(installment.dueDate, 1);
  const totalOriginalCuota = (installment.paidAmount || 0) + installment.amount;
  const nextRenewalDueDate = getNextPaymentDate(installment.dueDate, frequency);

  const handleSubmitAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount === '' || paymentAmount <= 0) {
      setError('Por favor ingrese un monto válido mayor a 0.');
      return;
    }

    onConfirmPayment(installment.id, Number(paymentAmount), isPartial ? (isPactada || !!installment.isPactada) : false);
    onClose();
  };

  const handleSubmitRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (renewalInterestAmount === '' || Number(renewalInterestAmount) <= 0) {
      setError('Por favor ingrese un valor válido de intereses a cobrar.');
      return;
    }

    if (onConfirmRenewal) {
      onConfirmRenewal(installment.id, Number(renewalInterestAmount));
    } else {
      storageService.renewInstallmentWithInterest(installment.id, Number(renewalInterestAmount));
    }
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
            <div className={`modal-title-icon ${modalMode === 'renovacion' ? 'renewal-icon' : 'text-success'}`}>
              {modalMode === 'renovacion' ? <RotateCcw size={22} className="text-primary" /> : <DollarSign size={22} className="text-success" />}
            </div>
            <div>
              <h3>{modalMode === 'renovacion' ? 'Renovación por Interés' : 'Registrar Pago / Abono'}</h3>
              <p className="modal-subtitle">Cuota #{installment.number} · {installment.clientName}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Selector de Modo: Pago Habitual vs Renovación por Interés */}
        <div className="modal-mode-tabs">
          <button
            type="button"
            className={`mode-tab-btn ${modalMode === 'abono' ? 'active' : ''}`}
            onClick={() => {
              setModalMode('abono');
              setError(null);
            }}
          >
            <DollarSign size={16} />
            <span>Abono / Pago de Cuota</span>
          </button>

          <button
            type="button"
            className={`mode-tab-btn ${modalMode === 'renovacion' ? 'active' : ''}`}
            onClick={() => {
              setModalMode('renovacion');
              setError(null);
            }}
          >
            <RotateCcw size={16} />
            <span>Renovar (+{renewalStepLabel})</span>
            <span className="mode-pill-badge">Interés</span>
          </button>
        </div>

        {modalMode === 'abono' ? (
          /* FORMULARIO DE PAGO / ABONO HABITUAL */
          <form onSubmit={handleSubmitAbono} className="modal-form">
            <div className="payment-summary-card">
              <div className="summary-row">
                <span className="summary-lbl"><User size={14} /> Cliente:</span>
                <span className="summary-val font-semibold">{installment.clientName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-lbl"><Calendar size={14} /> Vencimiento Actual:</span>
                <span className="summary-val">{installment.dueDate}</span>
              </div>
              {installment.paidAmount && installment.paidAmount > 0 && (
                <>
                  <div className="summary-row">
                    <span className="summary-lbl">Valor Total Cuota:</span>
                    <span className="summary-val font-semibold">{formatCurrency(totalOriginalCuota)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-lbl">Total Ya Cobrado:</span>
                    <span className="summary-val text-success font-semibold">{formatCurrency(installment.paidAmount)}</span>
                  </div>
                </>
              )}
              <div className="summary-row border-top">
                <span className="summary-lbl font-semibold">Saldo Pendiente por Saldar:</span>
                <span className="summary-val text-primary font-bold">{formatCurrency(installment.amount)}</span>
              </div>
              {installment.isPactada && (
                <div className="pact-active-pill">
                  <Clock size={13} />
                  <span>Cuota en acuerdo pactado · Plazo límite: <strong>{deadlineDate}</strong></span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="paymentAmount">Monto a Abonar ($)</label>
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
                  title="Saldar total de la cuota"
                >
                  Saldar Total
                </button>
              </div>
              
              {/* Opción para Pactar Cuota cuando el abono es parcial */}
              {isPartial && (
                <div className={`pacto-card ${isPactada || installment.isPactada ? 'active' : ''} animate-slide-up`}>
                  <label className="pacto-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPactada || !!installment.isPactada}
                      onChange={(e) => setIsPactada(e.target.checked)}
                      className="pacto-checkbox"
                    />
                    <div className="pacto-text-wrap">
                      <span className="pacto-title">
                        🤝 Pactar cuota (Plazo de 1 mes sin entrar en mora)
                      </span>
                      <span className="pacto-desc">
                        {isPactada || installment.isPactada ? (
                          <span>
                            ✨ Al abonar <strong>{formatCurrency(Number(paymentAmount))}</strong>, el cliente tendrá un plazo de 1 mes (hasta el <strong>{deadlineDate}</strong>) para realizar <strong>abonos libres</strong> y saldar el restante de <strong>{formatCurrency(installment.amount - Number(paymentAmount))}</strong> sin que la cuota entre en mora.
                          </span>
                        ) : (
                          `Marque para acordar un plazo de 1 mes (hasta el ${deadlineDate}) para saldar el saldo restante de ${formatCurrency(installment.amount - Number(paymentAmount))} mediante abonos libres sin generar mora.`
                        )}
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <small className="help-text">
                {isPartial && !isPactada && !installment.isPactada ? (
                  <span className="text-warning">
                    ⚠️ Abono parcial: Quedará un saldo pendiente de {formatCurrency(installment.amount - Number(paymentAmount))}.
                  </span>
                ) : paymentAmount !== '' && Number(paymentAmount) > installment.amount ? (
                  <span className="text-success">
                    ✨ Abono mayor: Cubre el saldo total y el excedente de {formatCurrency(Number(paymentAmount) - installment.amount)} se aplicará a la siguiente cuota.
                  </span>
                ) : !isPartial ? (
                  'Ingresa el monto del abono. Puedes ingresar cualquier valor libre o saldar la cuota.'
                ) : null}
              </small>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={`btn-primary ${(isPactada || installment.isPactada) && isPartial ? 'pactada-btn' : 'success-btn'}`}>
                <CheckCircle size={18} />
                {(isPactada || installment.isPactada) && isPartial ? 'Confirmar Abono Pactado' : 'Confirmar Pago'} ({formatCurrency(Number(paymentAmount) || 0)})
              </button>
            </div>
          </form>
        ) : (
          /* FORMULARIO DE RENOVACIÓN POR SOLO INTERESES */
          <form onSubmit={handleSubmitRenewal} className="modal-form">
            <div className="renewal-banner-card animate-slide-up">
              <div className="renewal-banner-header">
                <Sparkles size={18} className="text-primary" />
                <span className="renewal-banner-title">Pago de Interés & Renovación de Plazo</span>
              </div>
              <p className="renewal-banner-desc">
                El cliente cancela únicamente los <strong>intereses del periodo</strong> ({renewalStepLabel}). El capital prestado se mantiene intacto y las fechas de cobro se corren <strong>+{renewalStepLabel}</strong>, dando por saldado este periodo sin generar mora.
              </p>
            </div>

            <div className="renewal-details-grid">
              <div className="renewal-metric-box">
                <span className="metric-lbl">Capital en la Calle</span>
                <span className="metric-val text-primary font-bold">
                  {formatCurrency(installment.capitalAmount || (currentLoan ? currentLoan.capital : 0))}
                </span>
                <span className="metric-sub text-muted">Mantiene el saldo intacto</span>
              </div>

              <div className="renewal-metric-box highlight">
                <span className="metric-lbl">Ganancia a Cobrar</span>
                <span className="metric-val text-success font-bold">
                  {formatCurrency(Number(renewalInterestAmount) || 0)}
                </span>
                <span className="metric-sub text-success">Ingreso neto a caja</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="renewalInterestAmount">Valor de Intereses a Cobrar ($)</label>
              <div className="input-with-action">
                <input
                  id="renewalInterestAmount"
                  type="number"
                  step="any"
                  min="1"
                  value={renewalInterestAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setRenewalInterestAmount(val);
                  }}
                  placeholder="Ej. 200000"
                  autoFocus
                  required
                />
                <button 
                  type="button" 
                  className="full-pay-quick-btn"
                  onClick={() => setRenewalInterestAmount(defaultPeriodInterest)}
                  title="Restablecer interés calculado del periodo"
                >
                  Sugerido ({formatCurrency(defaultPeriodInterest)})
                </button>
              </div>
            </div>

            {/* Cronograma visual de la extensión de fecha */}
            <div className="date-shift-card">
              <div className="date-shift-col">
                <span className="date-shift-lbl">Fecha actual:</span>
                <span className="date-shift-val original">{installment.dueDate}</span>
              </div>
              <div className="date-shift-arrow">
                <ArrowRight size={18} />
                <span className="shift-badge">+{renewalStepLabel}</span>
              </div>
              <div className="date-shift-col">
                <span className="date-shift-lbl">Nueva fecha de cobro:</span>
                <span className="date-shift-val next">{nextRenewalDueDate}</span>
              </div>
            </div>

            <div className="renewal-guarantee-pill">
              <ShieldCheck size={14} className="text-success" />
              <span>
                {installment.renewalsCount && installment.renewalsCount > 0
                  ? `Esta cuota ya ha sido renovada ${installment.renewalsCount} ${installment.renewalsCount === 1 ? 'vez' : 'veces'}. Al confirmar sumará 1 ciclo más.`
                  : 'Se dará por saldado el periodo y la cuenta quedará al día para el siguiente ciclo.'}
              </span>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary renewal-confirm-btn">
                <RotateCcw size={18} />
                Confirmar Renovación ({formatCurrency(Number(renewalInterestAmount) || 0)})
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }

        .modal-content {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          width: 100%;
          max-width: 460px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .modal-title-icon {
          padding: 8px;
          background-color: rgba(16, 185, 129, 0.12);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title-icon.renewal-icon {
          background-color: rgba(14, 165, 233, 0.12);
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

        /* Mode Tabs */
        .modal-mode-tabs {
          display: flex;
          background-color: var(--bg-app);
          padding: 6px;
          gap: 6px;
          border-bottom: 1px solid var(--border-color);
        }

        .mode-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12.5px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-tab-btn.active {
          background-color: var(--bg-card);
          color: var(--text-primary);
          font-weight: 700;
          box-shadow: var(--shadow-sm);
        }

        .mode-pill-badge {
          font-size: 10px;
          background-color: rgba(14, 165, 233, 0.15);
          color: var(--primary);
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .modal-form {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
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

        /* Renewal specific styles */
        .renewal-banner-card {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(16, 185, 129, 0.08));
          border: 1px solid rgba(14, 165, 233, 0.25);
          border-radius: 12px;
          padding: 12px 14px;
        }

        .renewal-banner-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .renewal-banner-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .renewal-banner-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        .renewal-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .renewal-metric-box {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .renewal-metric-box.highlight {
          background-color: rgba(16, 185, 129, 0.06);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .metric-lbl {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        .metric-val {
          font-size: 16px;
        }

        .metric-sub {
          font-size: 10.5px;
        }

        .date-shift-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 10px 14px;
          gap: 8px;
        }

        .date-shift-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .date-shift-lbl {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .date-shift-val {
          font-size: 13px;
          font-weight: 700;
        }

        .date-shift-val.original {
          color: var(--text-tertiary);
          text-decoration: line-through;
        }

        .date-shift-val.next {
          color: var(--primary);
        }

        .date-shift-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: var(--primary);
        }

        .shift-badge {
          font-size: 10px;
          font-weight: 700;
          background-color: rgba(14, 165, 233, 0.15);
          padding: 2px 6px;
          border-radius: 6px;
          white-space: nowrap;
        }

        .renewal-guarantee-pill {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.35;
          padding: 6px 8px;
          border-radius: 8px;
          background-color: rgba(16, 185, 129, 0.05);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .input-with-action {
          display: flex;
          gap: 8px;
        }

        .input-with-action input {
          flex: 1;
          height: 46px;
          padding: 10px 14px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 12px;
          border: 1.5px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-with-action input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
          background-color: var(--bg-card);
        }

        .full-pay-quick-btn {
          padding: 0 14px;
          height: 46px;
          font-size: 12px;
          font-weight: 700;
          background-color: var(--bg-elevated);
          border: 1.5px solid var(--border-color);
          color: var(--primary);
          border-radius: 12px;
          white-space: nowrap;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .full-pay-quick-btn:hover {
          background-color: rgba(var(--primary-rgb), 0.12);
        }

        .help-text {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .error-banner {
          background-color: rgba(var(--danger-rgb), 0.1);
          color: var(--danger);
          border: 1px solid rgba(var(--danger-rgb), 0.3);
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
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
          padding: 12px;
          border-radius: 12px;
          border: 1.5px solid var(--border-color);
          background-color: var(--bg-elevated);
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-primary {
          flex: 2;
          height: 48px;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px var(--primary-glow);
          transition: transform 0.15s ease, filter 0.2s ease;
        }

        .btn-primary:active {
          transform: scale(0.98);
        }

        .renewal-confirm-btn {
          background: linear-gradient(135deg, #0284c7, #0d9488) !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
        }

        .renewal-confirm-btn:hover {
          opacity: 0.95;
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

        .pact-active-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          background-color: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.25);
          color: var(--primary);
          font-size: 11.5px;
          margin-top: 4px;
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
