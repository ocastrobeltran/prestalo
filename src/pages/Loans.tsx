import React, { useState } from 'react';
import type { Loan, Installment } from '../types';
import { formatCurrency } from '../services/loanCalculator';
import { Search, FilePlus, FileText, Trash2, ChevronDown, ChevronUp, DollarSign, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';

interface LoansProps {
  loans: Loan[];
  installments: Installment[];
  openNewLoanModal: () => void;
  onDeleteLoan: (id: string) => void;
  onViewReceipt: (loan: Loan) => void;
  onOpenPaymentModal: (installment: Installment) => void;
}

export const Loans: React.FC<LoansProps> = ({
  loans,
  installments,
  openNewLoanModal,
  onDeleteLoan,
  onViewReceipt,
  onOpenPaymentModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const toggleExpandLoan = (loanId: string) => {
    setExpandedLoanId(prev => prev === loanId ? null : loanId);
  };

  // Filtrar préstamos
  const filteredLoans = loans.filter(loan => 
    loan.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalLoansCount = loans.length;
  const activeLoansCount = loans.filter(l => l.status === 'active').length;
  const completedLoansCount = loans.filter(l => l.status === 'completed').length;

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
      {/* Tarjeta de Resumen de Préstamos (sin límites artificiales) */}
      <div className="cupo-card shadow-sm">
        <div className="cupo-header">
          <div className="cupo-title-wrap">
            <span className="cupo-title">Préstamos Registrados</span>
            <span className="cupo-status">ILIMITADO</span>
          </div>
          <span className="cupo-fraction" style={{ fontSize: '20px', fontWeight: 800 }}>{totalLoansCount}</span>
        </div>
        <div className="cupo-footer" style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Activos: <strong style={{ color: 'var(--success)' }}>{activeLoansCount}</strong></span>
          {completedLoansCount > 0 && <span>Completados: <strong style={{ color: 'var(--primary)' }}>{completedLoansCount}</strong></span>}
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
                  <button className="loan-action-btn cuotas" onClick={() => toggleExpandLoan(loan.id)}>
                    {expandedLoanId === loan.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedLoanId === loan.id ? 'Ocultar Cuotas' : 'Ver Cuotas / Abonar'}
                  </button>
                  <button className="loan-action-btn pdf" onClick={() => onViewReceipt(loan)}>
                    <FileText size={14} />
                    PDF
                  </button>
                  <button className="loan-action-btn delete" onClick={() => handleDeleteClick(loan.id, loan.clientName)}>
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>

                {/* Desglose de Cuotas desplegable */}
                {expandedLoanId === loan.id && (
                  <div className="loan-installments-section animate-scale-in">
                    <div className="inst-section-title font-semibold">
                      Desglose de Cuotas ({paid}/{total} pagadas)
                    </div>
                    <div className="loans-inst-grid">
                      {installments.filter(i => i.loanId === loan.id).map(inst => (
                        <div key={inst.id} className={`inst-mini-card ${inst.status}`}>
                          <div className="inst-mini-info">
                            <span className="inst-num">Cuota #{inst.number}</span>
                            <span className="inst-date">{inst.dueDate}</span>
                            <span className="inst-amount font-bold">{formatCurrency(inst.amount)}</span>
                          </div>
                          {inst.status === 'paid' ? (
                            <span className="inst-paid-badge"><CheckCircle2 size={12} /> Pagada</span>
                          ) : (
                            <button 
                              className="inst-pay-btn"
                              onClick={() => onOpenPaymentModal(inst)}
                            >
                              <DollarSign size={13} />
                              Abonar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

        .loan-action-btn.cuotas {
          border: 1px solid rgba(14, 165, 233, 0.3);
          background-color: rgba(14, 165, 233, 0.08);
          color: var(--primary);
          flex: 1.5;
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

        .loan-installments-section {
          margin-top: 12px;
          border-top: 1px dashed var(--border-color);
          padding-top: 10px;
        }

        .inst-section-title {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .loans-inst-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
        }

        .inst-mini-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .inst-mini-card.paid {
          opacity: 0.75;
          border-color: rgba(16, 185, 129, 0.3);
        }

        .inst-mini-info {
          display: flex;
          flex-direction: column;
          font-size: 11px;
        }

        .inst-num {
          font-weight: 700;
          color: var(--text-primary);
        }

        .inst-date {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .inst-amount {
          color: var(--primary);
          font-size: 12px;
          margin-top: 2px;
        }

        .inst-pay-btn {
          margin-top: 4px;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 700;
          background-color: var(--success);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: background-color 0.2s;
        }

        .inst-pay-btn:hover {
          background-color: #059669;
        }

        .inst-paid-badge {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--success);
          display: flex;
          align-items: center;
          gap: 4px;
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
