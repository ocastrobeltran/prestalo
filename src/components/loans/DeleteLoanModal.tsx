import React, { useEffect } from 'react';
import type { Loan } from '../../types';
import { formatCurrency } from '../../services/loanCalculator';
import { Trash2, AlertTriangle, Wallet, X } from 'lucide-react';

interface DeleteLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onConfirm: (loan: Loan) => void;
}

export const DeleteLoanModal: React.FC<DeleteLoanModalProps> = ({
  isOpen,
  onClose,
  loan,
  onConfirm
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !loan) return null;

  const handleConfirm = () => {
    onConfirm(loan);
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quincenal';
      case 'monthly': return 'Mensual';
      default: return freq;
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="delete-loan-title">
      <div className="delete-loan-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="delete-close-btn" onClick={onClose} aria-label="Cerrar ventana">
          <X size={20} />
        </button>

        <div className="delete-loan-header">
          <div className="delete-icon-box">
            <Trash2 size={26} className="danger-icon" />
          </div>
          <h3 id="delete-loan-title">Eliminar Préstamo</h3>
          <p className="delete-loan-subtitle">
            ¿Confirmas la eliminación del préstamo de <strong>{loan.clientName}</strong>?
          </p>
        </div>

        {/* Resumen del Préstamo */}
        <div className="loan-summary-box">
          <div className="loan-summary-row">
            <span className="summary-lbl">Cliente:</span>
            <span className="summary-val font-semibold">{loan.clientName}</span>
          </div>
          <div className="loan-summary-row">
            <span className="summary-lbl">Capital Desembolsado:</span>
            <span className="summary-val font-semibold">{formatCurrency(loan.capital)}</span>
          </div>
          <div className="loan-summary-row">
            <span className="summary-lbl">Total Pactado:</span>
            <span className="summary-val">{formatCurrency(loan.totalToPay)}</span>
          </div>
          <div className="loan-summary-row">
            <span className="summary-lbl">Modalidad:</span>
            <span className="summary-val">{loan.installmentsCount} cuotas ({getFrequencyLabel(loan.paymentFrequency)})</span>
          </div>
        </div>

        {/* Destacado Explícito: Reintegro de Capital al Disponible en Caja */}
        <div className="reintegration-highlight-card">
          <div className="reintegration-header">
            <div className="reintegration-icon-wrap">
              <Wallet size={20} className="reintegration-icon" />
            </div>
            <div>
              <h4 className="reintegration-title">Reintegro al Disponible en Caja</h4>
              <span className="reintegration-tag">Restablecimiento Automático</span>
            </div>
          </div>
          <div className="reintegration-amount">
            +{formatCurrency(loan.capital)}
          </div>
          <p className="reintegration-text">
            El capital desembolsado de <strong>{formatCurrency(loan.capital)}</strong> será devuelto de inmediato a tu <strong>Disponible en Caja</strong>, dejándolo libre para nuevos préstamos.
          </p>
        </div>

        {/* Advertencia Irreversible */}
        <div className="irreversible-warning">
          <AlertTriangle size={16} className="warning-icon" />
          <span>Esta acción es definitiva. Se eliminarán permanentemente el préstamo y su cronograma de cuotas.</span>
        </div>

        {/* Acciones */}
        <div className="delete-modal-actions">
          <button 
            type="button" 
            className="btn-modal-cancel" 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn-modal-delete-confirm" 
            onClick={handleConfirm}
          >
            <Trash2 size={16} />
            <span>Eliminar y Reintegrar Capital</span>
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(7, 10, 18, 0.72);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 220;
          padding: 0;
        }

        .delete-loan-card {
          width: 100%;
          max-width: 440px;
          background-color: var(--bg-card);
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          padding: 24px;
          padding-bottom: calc(24px + env(safe-area-inset-bottom));
          position: relative;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-color);
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (min-width: 480px) {
          .modal-overlay {
            align-items: center;
            padding: 16px;
          }

          .delete-loan-card {
            border-radius: 20px;
            padding-bottom: 24px;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
          }
        }

        .delete-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-close-btn:hover {
          background-color: var(--bg-elevated);
          color: var(--text-primary);
        }

        .delete-loan-header {
          text-align: center;
          margin-bottom: 20px;
          padding-top: 4px;
        }

        .delete-icon-box {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background-color: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .danger-icon {
          color: var(--danger, #ef4444);
        }

        .delete-loan-header h3 {
          font-size: 19px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }

        .delete-loan-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .loan-summary-box {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .loan-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .summary-lbl {
          color: var(--text-secondary);
        }

        .summary-val {
          color: var(--text-primary);
        }

        /* Tarjeta Destacada de Reintegro */
        .reintegration-highlight-card {
          background: linear-gradient(135deg, rgba(0, 242, 157, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%);
          border: 1px solid rgba(0, 242, 157, 0.28);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 16px rgba(0, 242, 157, 0.06);
        }

        .reintegration-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .reintegration-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background-color: rgba(0, 242, 157, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .reintegration-icon {
          color: var(--success, #00f29d);
        }

        .reintegration-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .reintegration-tag {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--success, #00f29d);
        }

        .reintegration-amount {
          font-size: 22px;
          font-weight: 800;
          color: var(--success, #00f29d);
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .reintegration-text {
          font-size: 12.5px;
          line-height: 1.45;
          color: var(--text-secondary);
        }

        .irreversible-warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background-color: rgba(239, 68, 68, 0.07);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .warning-icon {
          color: var(--danger, #ef4444);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .delete-modal-actions {
          display: flex;
          gap: 10px;
        }

        .btn-modal-cancel {
          flex: 1;
          padding: 12px 14px;
          border-radius: 12px;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-modal-cancel:hover {
          background-color: var(--bg-elevated);
        }

        .btn-modal-delete-confirm {
          flex: 1.6;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-modal-delete-confirm:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(239, 68, 68, 0.45);
        }

        .btn-modal-delete-confirm:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};
