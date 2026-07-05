import React from 'react';
import { Modal } from '../common/Modal';
import type { Loan, Installment } from '../../types';
import { formatCurrency } from '../../services/loanCalculator';
import { Printer, MessageSquare, Calendar } from 'lucide-react';
import { Badge } from '../common/Badge';

interface LoanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  installments: Installment[];
}

export const LoanReceiptModal: React.FC<LoanReceiptModalProps> = ({ isOpen, onClose, loan, installments }) => {
  if (!loan) return null;

  // Filtrar cuotas correspondientes a este préstamo
  const loanInstallments = installments.filter(i => i.loanId === loan.id);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const message = `*PRESTALO - Comprobante de Crédito*
---------------------------------------
*Cliente:* ${loan.clientName}
*Capital Prestado:* ${formatCurrency(loan.capital)}
*Interés:* ${loan.interestRate}%
*Total a Pagar:* ${formatCurrency(loan.totalToPay)}
*Frecuencia:* ${
      loan.paymentFrequency === 'daily' ? 'Diario' : 
      loan.paymentFrequency === 'weekly' ? 'Semanal' : 
      loan.paymentFrequency === 'biweekly' ? 'Quincenal' : 'Mensual'
    }
*N° Cuotas:* ${loan.installmentsCount}
*Fecha de Inicio:* ${loan.startDate}
*Fecha de Vence:* ${loan.endDate}

*Plan de Cuotas:*
${loanInstallments.map(i => `- Cuota #${i.number}: ${formatCurrency(i.amount)} [Vence: ${i.dueDate}] -> *${i.status === 'paid' ? 'PAGADO ✓' : 'PENDIENTE'}*`).join('\n')}

Gracias por su confianza.`;
    
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Crédito"
    >
      <div className="receipt-container" id="printable-receipt">
        <div className="receipt-brand">
          <h2>PRÉSTALO</h2>
          <p>Gestión de Crédito Directo</p>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-section">
          <h4 className="section-title">Detalles del Préstamo</h4>
          <div className="receipt-info-grid">
            <div className="info-row">
              <span className="info-label">Cliente:</span>
              <span className="info-val font-semibold">{loan.clientName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">ID Préstamo:</span>
              <span className="info-val code">{loan.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha Desembolso:</span>
              <span className="info-val">{loan.startDate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha Vencimiento:</span>
              <span className="info-val">{loan.endDate}</span>
            </div>
          </div>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-section">
          <h4 className="section-title">Resumen de Cuenta</h4>
          <div className="receipt-totals-box">
            <div className="total-row">
              <span>Capital Desembolsado:</span>
              <span className="font-semibold">{formatCurrency(loan.capital)}</span>
            </div>
            <div className="total-row text-xs">
              <span>Interés Aplicado ({loan.interestRate}%):</span>
              <span className="success">{formatCurrency((loan.capital * loan.interestRate) / 100)}</span>
            </div>
            <div className="total-row highlight">
              <span>Total a Cobrar:</span>
              <span>{formatCurrency(loan.totalToPay)}</span>
            </div>
          </div>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-section">
          <h4 className="section-title">Tabla de Cuotas ({loan.installmentsCount})</h4>
          <div className="installments-table">
            <div className="table-header">
              <span>Cuota</span>
              <span>Vence</span>
              <span className="text-right">Monto</span>
              <span className="text-right">Estado</span>
            </div>
            <div className="table-body">
              {loanInstallments.map((inst) => (
                <div key={inst.id} className="table-row">
                  <span className="font-semibold">#{inst.number}</span>
                  <span className="text-muted flex items-center gap-1">
                    <Calendar size={12} />
                    {inst.dueDate}
                  </span>
                  <span className="font-semibold text-right">{formatCurrency(inst.amount)}</span>
                  <span className="text-right">
                    <Badge status={inst.status} text={inst.status === 'paid' ? 'Pagada' : 'Pendiente'} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="receipt-footer">
          <p>Este documento es un comprobante de control interno.</p>
          <p className="footer-date">Generado el: {new Date().toLocaleString()}</p>
        </div>
      </div>

      <div className="receipt-actions no-print">
        <button className="action-btn btn-print" onClick={handlePrint}>
          <Printer size={18} />
          Imprimir / PDF
        </button>
        <button className="action-btn btn-whatsapp" onClick={handleSendWhatsApp}>
          <MessageSquare size={18} />
          WhatsApp
        </button>
      </div>

      <style>{`
        .receipt-container {
          background-color: var(--bg-card);
          padding: 8px 4px;
        }

        .receipt-brand {
          text-align: center;
          margin-bottom: 12px;
        }

        .receipt-brand h2 {
          font-size: 24px;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .receipt-brand p {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }

        .receipt-divider {
          border-top: 1px dashed var(--border-color);
          margin: 16px 0;
        }

        .receipt-section {
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .receipt-info-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .info-label {
          color: var(--text-secondary);
        }

        .info-val {
          color: var(--text-primary);
          text-align: right;
        }

        .info-val.code {
          font-family: monospace;
          font-size: 11px;
          color: var(--text-secondary);
        }

        .receipt-totals-box {
          background-color: var(--bg-input);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 1px solid var(--border-color);
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .total-row.highlight {
          border-top: 1px solid var(--border-color);
          padding-top: 8px;
          margin-top: 4px;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .text-xs {
          font-size: 12px;
        }

        .installments-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .table-header {
          display: grid;
          grid-template-columns: 0.8fr 1.8fr 1.4fr 1fr;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
          text-transform: uppercase;
        }

        .table-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .table-row {
          display: grid;
          grid-template-columns: 0.8fr 1.8fr 1.4fr 1fr;
          font-size: 12px;
          align-items: center;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.02);
        }

        .text-muted {
          color: var(--text-secondary);
        }

        .text-right {
          text-align: right;
        }

        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .footer-date {
          font-size: 9px;
          margin-top: 4px;
        }

        .receipt-actions {
          margin-top: 24px;
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .btn-print {
          background-color: var(--text-primary);
        }

        .btn-whatsapp {
          background-color: var(--success);
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
        }

        /* Soporte para impresion */
        @media print {
          .receipt-actions {
            display: none !important;
          }
          .modal-backdrop {
            background-color: white !important;
            backdrop-filter: none !important;
            position: relative !important;
            z-index: auto !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            border-radius: 0 !important;
          }
          .modal-header, .modal-close-btn {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  );
};
