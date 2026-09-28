import React, { useState } from 'react';
import type { Loan, Installment } from '../types';
import { formatCurrency, getPaidBreakdownForInstallment, getInstallmentEffectiveStatus } from '../services/loanCalculator';
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
  initialStatusFilter?: 'all' | 'active' | 'overdue' | 'completed';
}

type LoanStatusFilter = 'all' | 'active' | 'overdue' | 'completed';

export const Loans: React.FC<LoansProps> = ({
  loans,
  installments,
  openNewLoanModal,
  onDeleteLoan,
  onViewReceipt,
  onOpenPaymentModal,
  initialStatusFilter = 'all'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatusFilter>(initialStatusFilter);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const toggleExpandLoan = (loanId: string) => {
    setExpandedLoanId(prev => prev === loanId ? null : loanId);
  };

  // Helper para verificar mora real según especificación
  const checkIsLoanOverdue = (loan: Loan) => {
    return loan.status === 'overdue' || (loan.status === 'active' && new Date(loan.endDate + 'T23:59:59').getTime() < Date.now());
  };

  // Conteo de préstamos por estado
  const totalLoansCount = loans.length;
  const overdueLoansCount = loans.filter(l => checkIsLoanOverdue(l)).length;
  const activeLoansCount = loans.filter(l => l.status === 'active' && !checkIsLoanOverdue(l)).length;
  const completedLoansCount = loans.filter(l => l.status === 'completed').length;

  // Filtrar préstamos por búsqueda y estado
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isOverdue = checkIsLoanOverdue(loan);
    if (statusFilter === 'active') return loan.status === 'active' && !isOverdue;
    if (statusFilter === 'overdue') return isOverdue;
    if (statusFilter === 'completed') return loan.status === 'completed';
    return true;
  });

  // Obtener cuotas pagadas vs totales de un préstamo
  const getLoanInstallmentsProgress = (loanId: string) => {
    const loanInstallments = installments.filter(i => i.loanId === loanId);
    const total = loanInstallments.length;
    const paid = loanInstallments.filter(i => i.status === 'paid' || i.amount <= 0).length;
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    return { paid, total, percentage };
  };

  // Calcular tiempo restante para vencimiento de forma amigable
  const getVencimientoText = (endDateStr: string, status: string, isOverdue: boolean) => {
    if (status === 'completed') return 'Completado';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(endDateStr + 'T00:00:00');
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 || isOverdue) {
      const daysCount = Math.abs(diffDays);
      return `Vencido hace ${daysCount} ${daysCount === 1 ? 'día' : 'días'}`;
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
      {/* Tarjeta de Resumen de Préstamos */}
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
          {overdueLoansCount > 0 && <span>En Mora: <strong style={{ color: 'var(--danger)' }}>{overdueLoansCount}</strong></span>}
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

      {/* Filtros Rápidos por Estado */}
      <div className="loan-status-filter-pills">
        <button 
          className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          📋 Todos ({totalLoansCount})
        </button>
        <button 
          className={`status-pill ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          ⚡ Activos ({activeLoansCount})
        </button>
        <button 
          className={`status-pill ${statusFilter === 'overdue' ? 'active overdue' : ''}`}
          onClick={() => setStatusFilter('overdue')}
        >
          ⚠️ En Mora ({overdueLoansCount})
        </button>
        <button 
          className={`status-pill ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('completed')}
        >
          ✓ Pagados ({completedLoansCount})
        </button>
      </div>

      {/* Lista de Préstamos */}
      <div className="loans-list">
        {filteredLoans.length === 0 ? (
          <div className="empty-state">
            <p>{statusFilter === 'overdue' ? '¡Excelente! No tienes préstamos en mora actualmente.' : 'No se encontraron préstamos registrados.'}</p>
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const { paid, total, percentage } = getLoanInstallmentsProgress(loan.id);
            const isLoanOverdue = loan.status === 'overdue' || (loan.status === 'active' && new Date(loan.endDate + 'T23:59:59').getTime() < Date.now());
            const vencimientoText = getVencimientoText(loan.endDate, loan.status, isLoanOverdue);

            // Buscar la cuota pendiente más urgente para cobro/abono directo
            const loanInstallments = installments.filter(i => i.loanId === loan.id);
            const urgentInstallment = loanInstallments
              .filter(i => {
                const eff = getInstallmentEffectiveStatus(i);
                return eff !== 'paid' && i.amount > 0;
              })
              .sort((a, b) => a.number - b.number)[0];
            
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
                      {loan.renewalsCount && loan.renewalsCount > 0 ? (
                        <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                          · 🔄 {loan.renewalsCount} {loan.renewalsCount === 1 ? 'renovación' : 'renovaciones'}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <Badge 
                    status={isLoanOverdue ? 'overdue' : (loan.status === 'completed' ? 'paid' : 'active')} 
                    text={isLoanOverdue ? 'Mora' : (loan.status === 'completed' ? 'Pagado' : 'Activo')} 
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
                  <ProgressBar progress={percentage} color={isLoanOverdue ? 'var(--danger)' : 'var(--primary)'} />
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
                  {urgentInstallment && (
                    <button 
                      className={`loan-action-btn quick-pay ${isLoanOverdue ? 'overdue' : ''}`}
                      onClick={() => onOpenPaymentModal(urgentInstallment)}
                      title={isLoanOverdue ? `Cobrar cuota #${urgentInstallment.number} en mora` : `Abonar a la cuota #${urgentInstallment.number}`}
                    >
                      <DollarSign size={14} />
                      <span>{isLoanOverdue ? `Cobrar C#${urgentInstallment.number}` : `Abonar C#${urgentInstallment.number}`}</span>
                    </button>
                  )}
                  <button className="loan-action-btn cuotas" onClick={() => toggleExpandLoan(loan.id)}>
                    {expandedLoanId === loan.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedLoanId === loan.id ? 'Ocultar Cuotas' : 'Ver Cuotas'}
                  </button>
                  <button className="loan-action-btn pdf" onClick={() => onViewReceipt(loan)}>
                    <FileText size={14} />
                    PDF
                  </button>
                  <button className="loan-action-btn delete" onClick={() => handleDeleteClick(loan.id, loan.clientName)}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Desglose de Cuotas desplegable */}
                {expandedLoanId === loan.id && (
                  <div className="loan-installments-section animate-scale-in">
                    <div className="inst-section-title font-semibold">
                      Desglose de Cuotas ({paid}/{total} pagadas)
                    </div>
                    <div className="loans-inst-grid">
                      {installments.filter(i => i.loanId === loan.id).map(inst => {
                        const breakdown = getPaidBreakdownForInstallment(inst, loan);
                        const paidVal = (inst.paidAmount && inst.paidAmount > 0) ? inst.paidAmount : breakdown.paidTotal;
                        const effectiveStatus = getInstallmentEffectiveStatus(inst);
                        const isPaid = effectiveStatus === 'paid';
                        const isOverdueState = effectiveStatus === 'overdue';
                        const isPactadaState = effectiveStatus === 'pactada';

                        return (
                          <div key={inst.id} className={`inst-mini-card ${isPaid ? 'paid' : isOverdueState ? 'overdue' : ''} ${inst.isPactada ? 'pactada' : ''}`}>
                            <div className="inst-mini-info">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="inst-num">Cuota #{inst.number}</span>
                                {inst.renewalsCount && inst.renewalsCount > 0 && (
                                  <span style={{ fontSize: '9px', color: '#0284c7', fontWeight: 700, backgroundColor: 'rgba(2, 132, 199, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                    🔄 {inst.renewalsCount} ren.
                                  </span>
                                )}
                                {isPactadaState && (
                                  <span style={{ fontSize: '9px', color: '#0284c7', fontWeight: 700 }}>
                                    🤝 Pactada
                                  </span>
                                )}
                                {isOverdueState && (
                                  <span style={{ fontSize: '9px', color: 'var(--danger)', fontWeight: 700 }}>
                                    ⚠️ Vencida
                                  </span>
                                )}
                              </div>
                              <span className="inst-date">Vence: {inst.dueDate}</span>
                              {inst.paidAmount && inst.paidAmount > 0 && !isPaid && (
                                <span style={{ fontSize: '10px', color: 'var(--success)' }}>
                                  {inst.renewalsCount && inst.renewalsCount > 0 ? 'Intereses abonados' : 'Abonado'}: {formatCurrency(inst.paidAmount)}
                                </span>
                              )}
                              <span className="inst-amount font-bold">
                                {isPaid ? formatCurrency(paidVal) : (inst.paidAmount && inst.paidAmount > 0 ? `Resta: ${formatCurrency(inst.amount)}` : formatCurrency(inst.amount))}
                              </span>
                            </div>
                            {isPaid ? (
                              inst.isPactada ? (
                                <span className="inst-paid-badge pactada" title={`Completada tras pacto. Total pagado: ${formatCurrency(paidVal)}`}>
                                  <CheckCircle2 size={12} /> Pagada (Pactada)
                                </span>
                              ) : (
                                <span className="inst-paid-badge">
                                  <CheckCircle2 size={12} /> Pagada
                                </span>
                              )
                            ) : (
                              <button 
                                className={`inst-pay-btn ${isPactadaState ? 'pactada-pay-btn' : ''}`}
                                onClick={() => onOpenPaymentModal(inst)}
                                title={isPactadaState ? 'Realizar abono libre para saldar cuota pactada' : 'Abonar a la cuota'}
                              >
                                <DollarSign size={13} />
                                Abonar
                              </button>
                            )}
                          </div>
                        );
                      })}
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

        .loan-status-filter-pills {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          -webkit-overflow-scrolling: touch;
        }

        .status-pill {
          padding: 7px 14px;
          border-radius: 20px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .status-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .status-pill.active {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .status-pill.active.overdue {
          background-color: var(--danger);
          color: white;
          border-color: var(--danger);
        }

        .loan-action-btn.quick-pay {
          background-color: var(--success);
          color: white;
          border: none;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
          flex: 1.5;
        }

        .loan-action-btn.quick-pay:hover {
          background-color: #059669;
        }

        .loan-action-btn.quick-pay.overdue {
          background-color: var(--danger);
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .loan-action-btn.quick-pay.overdue:hover {
          background-color: #dc2626;
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

        .inst-paid-badge.pactada {
          color: #0284c7;
        }

        .inst-mini-card.pactada {
          border-color: rgba(2, 132, 199, 0.4);
          background-color: rgba(2, 132, 199, 0.06);
        }

        .inst-mini-card.overdue {
          border-color: rgba(239, 68, 68, 0.4);
          background-color: rgba(239, 68, 68, 0.05);
        }

        .pactada-pay-btn {
          background: linear-gradient(135deg, #0284c7, #0ea5e9) !important;
        }

        .pactada-pay-btn:hover {
          background: linear-gradient(135deg, #0369a1, #0284c7) !important;
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
