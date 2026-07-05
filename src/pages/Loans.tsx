import React, { useState } from 'react';
import type { Loan, Installment } from '../types';
import { formatCurrency } from '../services/loanCalculator';
import { Search, FilePlus, FileText, Trash2 } from 'lucide-react';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';

interface LoansProps {
  loans: Loan[];
  installments: Installment[];
  openNewLoanModal: () => void;
  onDeleteLoan: (id: string) => void;
  onViewReceipt: (loan: Loan) => void;
}

export const Loans: React.FC<LoansProps> = ({
  loans,
  installments,
  openNewLoanModal,
  onDeleteLoan,
  onViewReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar préstamos
  const filteredLoans = loans.filter(loan => 
    loan.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeLoansCount = loans.filter(l => l.status === 'active').length;
  const totalCupo = 10;
  const cupoPercentage = (activeLoansCount / totalCupo) * 100;

  // Obtener cuotas pagadas vs totales de un préstamo
  const getLoanInstallmentsProgress = (loanId: string) => {
    const loanInstallments = installments.filter(i => i.loanId === loanId);
    const total = loanInstallments.length;
    const paid = loanInstallments.filter(i => i.status === 'paid').length;
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    return { paid, total, percentage };
  };

  // Calcular tiempo restante para vencimiento de forma amigable
  const getVencimientoText = (endDateStr: string, status: string) => {
    if (status === 'completed') return 'Completado';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(endDateStr + 'T00:00:00');
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Vencido hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`;
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays === 1) {
      return 'Vence mañana';
    } else if (diffDays < 7) {
      return `Vence en ${diffDays} días`;
    } else {
      const weeks = Math.round(diffDays / 7);
      return `Vence: ${endDateStr} (En ${weeks} ${weeks === 1 ? 'semana' : 'semanas'})`;
    }
  };

  const handleDeleteClick = (id: string, clientName: string) => {
    if (window.confirm(`¿Está seguro de eliminar el préstamo de "${clientName}"? Esta acción no se puede deshacer y revertirá los desembolsos en la caja.`)) {
      onDeleteLoan(id);
    }
  };

  return (
    <div className="loans-container animate-fade-in">
      {/* Cupo Card (de acuerdo a la captura 4) */}
      <div className="cupo-card shadow-sm">
        <div className="cupo-header">
          <div className="cupo-title-wrap">
            <span className="cupo-title">Préstamos Activos</span>
            <span className="cupo-status">DISPONIBLE</span>
          </div>
          <span className="cupo-fraction">{activeLoansCount}/{totalCupo}</span>
        </div>
        <ProgressBar progress={cupoPercentage} color="var(--success)" />
        <div className="cupo-footer">
          <span>{cupoPercentage.toFixed(0)}% Utilizado</span>
        </div>
      </div>

      {/* Buscador y Botón de Añadir */}
      <div className="search-bar-wrap">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="add-loan-btn" onClick={openNewLoanModal}>
          <FilePlus size={18} />
          <span>Préstamo</span>
        </button>
      </div>

      {/* Lista de Préstamos */}
      <div className="loans-list">
        {filteredLoans.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron préstamos registrados.</p>
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const { paid, total, percentage } = getLoanInstallmentsProgress(loan.id);
            const vencimientoText = getVencimientoText(loan.endDate, loan.status);
            const isLoanOverdue = loan.status === 'active' && new Date(loan.endDate + 'T23:59:59').getTime() < Date.now();
            
            return (
              <div key={loan.id} className="loan-card shadow-sm">
                <div className="loan-card-header">
                  <div className="client-info">
                    <h4 className="client-name">{loan.clientName}</h4>
                    <span className="loan-meta">
                      {loan.installmentsCount} cuota{loan.installmentsCount !== 1 ? 's' : ''} · {
                        loan.paymentFrequency === 'daily' ? 'diario' :
                        loan.paymentFrequency === 'weekly' ? 'semanal' :
                        loan.paymentFrequency === 'biweekly' ? 'quincenal' : 'mensual'
                      } · {loan.interestRate}%
                    </span>
                  </div>
                  <Badge 
                    status={isLoanOverdue ? 'overdue' : loan.status} 
                    text={isLoanOverdue ? 'Mora' : loan.status === 'active' ? 'Activo' : 'Pagado'} 
                  />
                </div>

                <div className="loan-card-amounts">
                  <div className="amount-col">
                    <span className="amount-lbl">Desembolsado</span>
                    <span className="amount-val blue">{formatCurrency(loan.capital)}</span>
                  </div>
                  <div className="amount-col text-right">
                    <span className="amount-lbl">Total a Pagar</span>
                    <span className="amount-val text-primary">{formatCurrency(loan.totalToPay)}</span>
                  </div>
                </div>

                <div className="loan-card-progress">
                  <div className="progress-labels">
                    <span>Cuotas: {paid}/{total}</span>
                    <span>Pagado: {percentage.toFixed(1)}%</span>
                  </div>
                  <ProgressBar progress={percentage} color="var(--primary)" />
                </div>

                <div className="loan-card-dates">
                  <span className="date-item">
                    Inicio: {loan.startDate}
                  </span>
                  <span className={`date-item font-semibold ${isLoanOverdue ? 'danger' : 'success'}`}>
                    {vencimientoText}
                  </span>
                </div>

                <div className="loan-card-actions">
                  <button className="loan-action-btn pdf" onClick={() => onViewReceipt(loan)}>
                    <FileText size={14} />
                    PDF
                  </button>
                  <button className="loan-action-btn delete" onClick={() => handleDeleteClick(loan.id, loan.clientName)}>
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .loans-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cupo-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .cupo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .cupo-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cupo-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cupo-status {
          font-size: 10px;
          font-weight: 800;
          color: var(--success);
          background-color: rgba(16, 185, 129, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .cupo-fraction {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          color: var(--success);
        }

        .cupo-footer {
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-tertiary);
          text-align: right;
        }

        .search-bar-wrap {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .search-input-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
        }

        .search-input-container input {
          width: 100%;
          padding: 12px;
          padding-left: 38px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-card);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }

        .search-input-container input:focus {
          border-color: var(--primary);
        }

        .add-loan-btn {
          background-color: var(--primary);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: var(--shadow-sm);
        }

        .loans-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .loan-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .loan-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .client-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .client-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .loan-meta {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .loan-card-amounts {
          display: flex;
          justify-content: space-between;
          background-color: var(--bg-app);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .amount-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .amount-lbl {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .amount-val {
          font-family: var(--font-heading);
          font-size: 15px;
          font-weight: 700;
        }

        .amount-val.blue {
          color: var(--primary);
        }

        .loan-card-progress {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .loan-card-dates {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
          border-top: 1px solid var(--border-color);
          padding-top: 8px;
        }

        .date-item.success { color: var(--success); }
        .date-item.danger { color: var(--danger); }

        .loan-card-actions {
          display: flex;
          gap: 12px;
          border-top: 1px dashed var(--border-color);
          padding-top: 12px;
        }

        .loan-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .loan-action-btn.pdf {
          border: 1px solid var(--border-color);
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .loan-action-btn.delete {
          background-color: rgba(239, 68, 68, 0.08);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .text-right {
          text-align: right;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};
