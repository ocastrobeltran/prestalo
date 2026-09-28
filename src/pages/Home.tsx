import React, { useState } from 'react';
import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';
import { formatCurrency, calculateFinancialSummary } from '../services/loanCalculator';
import { TrendingUp, Users, DollarSign, Wallet, Calendar, FileText, ChevronRight, UserPlus, FilePlus, Banknote, Route, Heart, Sparkles, Hourglass, Siren, ArrowUpRight } from 'lucide-react';

interface HomeProps {
  clients: Client[];
  loans: Loan[];
  installments: Installment[];
  capitalBox: CapitalBox;
  transactions?: CapitalTransaction[];
  setActiveTab: (tab: string) => void;
  openNewClientModal: () => void;
  openNewLoanModal: () => void;
  onUpdateCapital: (newCapital: number) => void;
  onNavigateToOverdueCalendar?: () => void;
  onNavigateToOverdueLoans?: () => void;
  onOpenWithdrawProfit?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  clients,
  loans,
  installments,
  capitalBox,
  transactions = [],
  setActiveTab,
  openNewClientModal,
  openNewLoanModal,
  onUpdateCapital,
  onNavigateToOverdueCalendar,
  onNavigateToOverdueLoans,
  onOpenWithdrawProfit
}) => {
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState<number | ''>('');

  const handleGoToOverdueCalendar = () => {
    if (onNavigateToOverdueCalendar) {
      onNavigateToOverdueCalendar();
    } else {
      setActiveTab('calendario');
    }
  };

  const handleGoToOverdueLoans = () => {
    if (onNavigateToOverdueLoans) {
      onNavigateToOverdueLoans();
    } else {
      setActiveTab('prestamos');
    }
  };

  // Calcular métricas
  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const activeLoansCount = loans.filter(l => l.status === 'active').length;
  
  // Calcular tasa de recuperación: cuotas pagadas / cuotas totales
  const paidInstallments = installments.filter(i => i.status === 'paid' || i.amount <= 0);
  const totalInstallmentsCount = installments.length;
  const recoveryRate = totalInstallmentsCount > 0 
    ? (paidInstallments.length / totalInstallmentsCount) * 100 
    : 0;

  // Resumen Financiero Consolidado (6 métricas según requerimiento)
  const summary = calculateFinancialSummary(loans, installments, transactions);

  // Próximos cobros en los siguientes 7 días
  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const upcomingPaymentsCount = installments.filter(
    i => (i.status === 'pending' || i.isPactada) && i.amount > 0 && i.dueDate >= todayStr && i.dueDate <= next7DaysStr
  ).length;

  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempCapital !== '' && tempCapital >= 0) {
      onUpdateCapital(tempCapital);
      setIsEditingCapital(false);
    }
  };

  const handleStartEditCapital = () => {
    setTempCapital(capitalBox.initialCapital);
    setIsEditingCapital(true);
  };

  return (
    <div className="home-container animate-fade-in">
      {/* Indicadores Superiores (Top Grid) */}
      <div className="stats-grid">
        <div className="stat-mini-card" onClick={() => setActiveTab('clientes')}>
          <div className="stat-icon-wrapper blue">
            <Users size={18} />
          </div>
          <div className="stat-mini-info">
            <span className="stat-val">{activeClientsCount}</span>
            <span className="stat-lbl">Clientes</span>
          </div>
        </div>

        <div className="stat-mini-card" onClick={() => setActiveTab('prestamos')}>
          <div className="stat-icon-wrapper green">
            <DollarSign size={18} />
          </div>
          <div className="stat-mini-info">
            <span className="stat-val">{activeLoansCount}</span>
            <span className="stat-lbl">Préstamos Activos</span>
          </div>
        </div>

        <div className="stat-mini-card" onClick={() => setActiveTab('reportes')}>
          <div className="stat-icon-wrapper orange">
            <TrendingUp size={18} />
          </div>
          <div className="stat-mini-info">
            <span className="stat-val">{recoveryRate.toFixed(1)}%</span>
            <span className="stat-lbl">Recuperación</span>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="card shadow-md">
        <div className="card-header-icon-title">
          <span style={{ fontSize: '20px', lineHeight: 1 }}>💰</span>
          <h3>Resumen Financiero</h3>
        </div>
        
        <div className="summary-cards-list">
          {/* 1. Capital Prestado */}
          <div className="summary-card">
            <div className="summary-icon-box icon-blue">
              <Banknote size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val default">{formatCurrency(summary.totalCapitalLent)}</div>
              <div className="summary-title">Capital Prestado</div>
              <div className="summary-subtext">Volumen histórico de créditos emitidos (incluye renovaciones)</div>
            </div>
          </div>

          {/* 2. En Calle */}
          <div className="summary-card">
            <div className="summary-icon-box icon-amber">
              <Route size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val amber">{formatCurrency(summary.enCalle)}</div>
              <div className="summary-title">En Calle</div>
              <div className="summary-subtext">Capital principal pendiente de devolución en préstamos activos. Incluye saldo de créditos abiertos y bullet</div>
            </div>
          </div>

          {/* 3. Recuperado */}
          <div className="summary-card">
            <div className="summary-icon-box icon-green">
              <Heart size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val green">{formatCurrency(summary.totalRecovered)}</div>
              <div className="summary-title">Recuperado</div>
              <div className="summary-subtext">Capital {formatCurrency(summary.totalPaidCapital)} · Int. {formatCurrency(summary.totalPaidInterest)}</div>
            </div>
          </div>

          {/* 4. Ganancia Neta */}
          <div className="summary-card">
            <div className="summary-icon-box icon-green">
              <Sparkles size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val-with-action">
                <div className="summary-val green">{formatCurrency(summary.availableProfit)}</div>
                {onOpenWithdrawProfit && (
                  <button 
                    type="button" 
                    className="btn-withdraw-profit" 
                    onClick={onOpenWithdrawProfit}
                    title="Retirar Ganancia Neta para uso personal"
                    aria-label="Retirar Ganancia Neta"
                  >
                    <span>Retirar Ganancia</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
              <div className="summary-title">Ganancia Disponible</div>
              <div className="summary-subtext">
                Cobrado {formatCurrency(summary.netProfit)}
                {summary.withdrawnProfit > 0 && (
                  <span> · Retirado <span className="text-withdrawn">-{formatCurrency(summary.withdrawnProfit)}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Pendiente */}
          <div className="summary-card">
            <div className="summary-icon-box icon-orange">
              <Hourglass size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val orange">{formatCurrency(summary.totalPending)}</div>
              <div className="summary-title">Pendiente</div>
              <div className="summary-subtext">Capital {formatCurrency(summary.pendingCapital)} · Próx. interés {formatCurrency(summary.pendingInterest)}</div>
            </div>
          </div>

          {/* 6. Vencido */}
          <div 
            className="summary-card clickable"
            onClick={handleGoToOverdueCalendar}
            role="button"
            tabIndex={0}
            title="Ver cobros vencidos en mora"
          >
            <div className="summary-icon-box icon-red">
              <Siren size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val red">{formatCurrency(summary.totalOverdue)}</div>
              <div className="summary-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Vencido</span>
                <span className="summary-action-arrow">Ver cobros →</span>
              </div>
              <div className="summary-subtext">Capital {formatCurrency(summary.overdueCapital)} · Int. {formatCurrency(summary.overdueInterest)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mi Capital */}
      <div className="card shadow-md">
        <div className="card-header-with-action">
          <div className="card-header-icon-title">
            <Wallet size={20} className="icon-blue" />
            <h3>Mi Capital</h3>
          </div>
          {!isEditingCapital && (
            <button className="text-btn" onClick={handleStartEditCapital}>
              Gestionar →
            </button>
          )}
        </div>

        {isEditingCapital ? (
          <form onSubmit={handleSaveCapital} className="capital-edit-form animate-scale-in">
            <input
              type="number"
              value={tempCapital}
              onChange={(e) => setTempCapital(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ingresar capital inicial"
              autoFocus
            />
            <div className="capital-form-btns">
              <button type="button" className="btn-cancel" onClick={() => setIsEditingCapital(false)}>Cancelar</button>
              <button type="submit" className="btn-save">Guardar</button>
            </div>
          </form>
        ) : (
          <div className="capital-box-info">
            <div className="capital-stat">
              <span className="capital-lbl">Capital Inicial de Trabajo:</span>
              <span className="capital-val-large">{formatCurrency(capitalBox.initialCapital)}</span>
            </div>
            <div className="capital-divider"></div>
            <div className="capital-sub-stats">
              <div className="sub-stat">
                <span className="sub-lbl">Disponible en Caja:</span>
                <span className="sub-val success">{formatCurrency(capitalBox.currentCapital)}</span>
              </div>
              <div className="sub-stat">
                <span className="sub-lbl">Total en Calle:</span>
                <span className="sub-val warning">{formatCurrency(capitalBox.totalLent)}</span>
              </div>
              {summary.withdrawnProfit > 0 && (
                <div className="sub-stat">
                  <span className="sub-lbl">Ganancias Retiradas:</span>
                  <span className="sub-val text-withdrawn">-{formatCurrency(summary.withdrawnProfit)}</span>
                </div>
              )}
            </div>
            {summary.withdrawnProfit > 0 && (
              <div className="capital-withdrawal-badge">
                <span className="withdrawal-dot"></span>
                <span>Se han retirado <strong>{formatCurrency(summary.withdrawnProfit)}</strong> de ganancias netas para uso personal.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner Prioritario de Cobros Vencidos en Mora */}
      {summary.overdueInstallmentsCount > 0 && (
        <div className="alert-banner overdue animate-slide-up" onClick={handleGoToOverdueCalendar} role="button" tabIndex={0}>
          <div className="alert-content">
            <div className="alert-icon-box-overdue">
              <Siren size={20} />
            </div>
            <div className="alert-text-group">
              <span className="alert-heading">
                ⚠️ Tienes <strong>{summary.overdueInstallmentsCount} {summary.overdueInstallmentsCount === 1 ? 'cobro vencido' : 'cobros vencidos'}</strong> en mora ({formatCurrency(summary.totalOverdue)})
              </span>
              <span className="alert-desc">Hay créditos con cuotas atrasadas pendientes de cobro inmediato</span>
            </div>
          </div>
          <div className="alert-buttons-group">
            <button 
              type="button"
              className="alert-sub-btn" 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleGoToOverdueLoans(); 
              }}
              title="Ver préstamos en mora"
            >
              Ver créditos
            </button>
            <div className="alert-badge-btn">
              <span>Cobrar</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Banner Alertas Próximos Cobros */}
      {upcomingPaymentsCount > 0 && (
        <div className="alert-banner animate-slide-up" onClick={() => setActiveTab('calendario')}>
          <div className="alert-content">
            <Calendar size={18} />
            <span>Tienes <strong>{upcomingPaymentsCount} cobros</strong> programados para los próx. 7d</span>
          </div>
          <ChevronRight size={18} />
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="quick-actions-section">
        <h4>Acciones Rápidas</h4>
        <div className="quick-actions-grid">
          <button className="quick-btn-card blue-gradient" onClick={openNewClientModal}>
            <UserPlus size={22} />
            <span>Nuevo Cliente</span>
          </button>
          
          <button className="quick-btn-card green-gradient" onClick={openNewLoanModal}>
            <FilePlus size={22} />
            <span>Nuevo Préstamo</span>
          </button>
          
          <button className="quick-btn-card orange-gradient" onClick={() => setActiveTab('calendario')}>
            <Calendar size={22} />
            <span>Calendario</span>
          </button>
          
          <button className="quick-btn-card purple-gradient" onClick={() => setActiveTab('reportes')}>
            <FileText size={22} />
            <span>Ver Reportes</span>
          </button>
        </div>
      </div>

      <style>{`
        .home-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .stat-mini-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, background-color 0.2s;
        }

        .stat-mini-card:hover {
          transform: translateY(-2px);
          background-color: var(--bg-input);
        }

        .stat-icon-wrapper {
          height: 32px;
          width: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue { background-color: rgba(14, 165, 233, 0.1); color: var(--primary); }
        .stat-icon-wrapper.green { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
        .stat-icon-wrapper.orange { background-color: rgba(245, 158, 11, 0.1); color: var(--warning); }

        .stat-mini-info {
          display: flex;
          flex-direction: column;
        }

        .stat-val {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .stat-lbl {
          font-size: 9px;
          font-weight: 500;
          color: var(--text-tertiary);
          margin-top: 1px;
          line-height: 1.1;
        }

        .card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .card-header-icon-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .card-header-icon-title h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .icon-orange { color: var(--warning); }
        .icon-blue { color: var(--primary); }

        .summary-cards-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .summary-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .summary-card:hover {
          transform: translateY(-1px);
        }

        .summary-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .summary-icon-box.icon-blue {
          background-color: rgba(var(--info-rgb), 0.12);
          color: var(--info);
        }

        .summary-icon-box.icon-amber {
          background-color: rgba(var(--warning-rgb), 0.15);
          color: var(--warning);
        }

        .summary-icon-box.icon-green {
          background-color: rgba(var(--success-rgb), 0.12);
          color: var(--success);
          border: 1px solid rgba(var(--success-rgb), 0.25);
        }

        .summary-icon-box.icon-orange {
          background-color: rgba(var(--warning-rgb), 0.12);
          color: var(--warning);
          border: 1px solid rgba(var(--warning-rgb), 0.25);
        }

        .summary-icon-box.icon-red {
          background-color: rgba(var(--danger-rgb), 0.12);
          color: var(--danger);
          border: 1px solid rgba(var(--danger-rgb), 0.25);
        }

        .summary-card-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .summary-val {
          font-family: var(--font-heading);
          font-size: 19px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.3px;
        }

        .summary-val-with-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 6px 10px;
          width: 100%;
        }

        .summary-val-with-action .summary-val {
          min-width: 0;
          word-break: break-word;
        }

        .btn-withdraw-profit {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(var(--success-rgb), 0.12);
          color: var(--success);
          border: 1px solid rgba(var(--success-rgb), 0.3);
          padding: 6px 12px;
          min-height: 30px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          text-decoration: none;
          flex-shrink: 0;
        }

        .btn-withdraw-profit:hover {
          background: var(--success);
          color: #ffffff;
          border-color: var(--success);
          box-shadow: 0 2px 8px rgba(var(--success-rgb), 0.25);
          transform: translateY(-1px);
        }

        .btn-withdraw-profit:active {
          transform: translateY(0);
        }

        .btn-withdraw-profit:focus-visible {
          outline: 2px solid var(--success);
        }

        .text-withdrawn {
          color: var(--warning);
          font-weight: 600;
        }

        .capital-withdrawal-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(var(--warning-rgb), 0.08);
          border: 1px solid rgba(var(--warning-rgb), 0.2);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .capital-withdrawal-badge strong {
          color: var(--text-primary);
        }

        .withdrawal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--warning);
          flex-shrink: 0;
        }

        .summary-val.default { color: var(--text-primary); }
        .summary-val.amber { color: var(--warning); }
        .summary-val.green { color: var(--success); }
        .summary-val.orange { color: var(--warning); }
        .summary-val.red { color: var(--danger); }

        .summary-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .summary-subtext {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.25;
          margin-top: 1px;
        }

        .card-header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .text-btn {
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
        }

        .capital-box-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .capital-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .capital-lbl {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .capital-val-large {
          font-family: var(--font-heading);
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .capital-divider {
          height: 1px;
          background-color: var(--border-color);
        }

        .capital-sub-stats {
          display: flex;
          gap: 16px;
        }

        .sub-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sub-lbl {
          font-size: 11px;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .sub-val {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .sub-val.success { color: var(--success); }
        .sub-val.warning { color: var(--warning); }

        .capital-edit-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .capital-edit-form input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }

        .capital-edit-form input:focus {
          border-color: var(--primary);
        }

        .capital-form-btns {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .capital-form-btns button {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .btn-cancel {
          background-color: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .btn-save {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .summary-card.clickable {
          cursor: pointer;
        }

        .summary-card.clickable:hover {
          border-color: rgba(var(--danger-rgb), 0.4);
          background-color: rgba(var(--danger-rgb), 0.04);
        }

        .summary-action-arrow {
          font-size: 11px;
          color: var(--danger);
          font-weight: 700;
        }

        .alert-banner {
          background: rgba(var(--warning-rgb), 0.1);
          border: 1px solid rgba(var(--warning-rgb), 0.3);
          color: var(--warning);
          padding: 14px 16px;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }

        .alert-banner.overdue {
          background: rgba(var(--danger-rgb), 0.1);
          border: 1px solid rgba(var(--danger-rgb), 0.35);
          color: var(--danger);
        }

        .alert-banner.overdue:hover {
          background: rgba(var(--danger-rgb), 0.14);
        }

        .alert-icon-box-overdue {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background-color: rgba(var(--danger-rgb), 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--danger);
          flex-shrink: 0;
        }

        .alert-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .alert-heading {
          font-size: 13px;
          color: var(--text-primary);
        }

        .alert-heading strong {
          color: var(--danger);
        }

        .alert-desc {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .alert-buttons-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-sub-btn {
          padding: 6px 10px;
          border-radius: 8px;
          background-color: rgba(var(--danger-rgb), 0.12);
          color: var(--danger);
          border: 1px solid rgba(var(--danger-rgb), 0.3);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s;
        }

        .alert-sub-btn:hover {
          background-color: rgba(var(--danger-rgb), 0.22);
        }

        .alert-badge-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 8px;
          background-color: var(--danger);
          color: white;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
        }

        .alert-banner:active {
          transform: scale(0.98);
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .quick-actions-section {
          margin-top: 8px;
        }

        .quick-actions-section h4 {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-tertiary);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .quick-btn-card {
          height: 100px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          color: white;
          box-shadow: var(--shadow-md);
          padding: 12px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .quick-btn-card:active {
          transform: scale(0.95);
        }

        .quick-btn-card span {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.1px;
        }

        .blue-gradient { 
          background: var(--bg-card);
          border: 1px solid rgba(var(--info-rgb), 0.3);
          color: var(--info);
          box-shadow: var(--shadow-sm);
        }
        .green-gradient { 
          background: var(--bg-card);
          border: 1px solid rgba(var(--success-rgb), 0.35);
          color: var(--success);
          box-shadow: var(--shadow-sm);
        }
        .orange-gradient { 
          background: var(--bg-card);
          border: 1px solid rgba(var(--warning-rgb), 0.3);
          color: var(--warning);
          box-shadow: var(--shadow-sm);
        }
        .purple-gradient { 
          background: var(--bg-card);
          border: 1px solid rgba(var(--accent-purple-rgb), 0.3);
          color: var(--accent-purple);
          box-shadow: var(--shadow-sm);
        }

        @media (max-width: 480px) {
          .summary-card {
            padding: 12px;
            gap: 10px;
          }

          .summary-val-with-action {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .btn-withdraw-profit {
            font-size: 11px;
            padding: 6px 12px;
            min-height: 30px;
          }
        }
      `}</style>
    </div>
  );
};
