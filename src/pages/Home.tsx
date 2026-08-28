import React, { useState } from 'react';
import type { Client, Loan, Installment, CapitalBox } from '../types';
import { formatCurrency, calculateFinancialSummary } from '../services/loanCalculator';
import { TrendingUp, Users, DollarSign, Wallet, Calendar, FileText, ChevronRight, UserPlus, FilePlus, Banknote, Route, Heart, Sparkles, Hourglass, Siren } from 'lucide-react';

interface HomeProps {
  clients: Client[];
  loans: Loan[];
  installments: Installment[];
  capitalBox: CapitalBox;
  setActiveTab: (tab: string) => void;
  openNewClientModal: () => void;
  openNewLoanModal: () => void;
  onUpdateCapital: (newCapital: number) => void;
}

export const Home: React.FC<HomeProps> = ({
  clients,
  loans,
  installments,
  capitalBox,
  setActiveTab,
  openNewClientModal,
  openNewLoanModal,
  onUpdateCapital
}) => {
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState<number | ''>('');

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
  const summary = calculateFinancialSummary(loans, installments);

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
              <div className="summary-val green">{formatCurrency(summary.netProfit)}</div>
              <div className="summary-title">Ganancia Neta</div>
              <div className="summary-subtext">Int. {formatCurrency(summary.totalPaidInterest)}</div>
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
          <div className="summary-card">
            <div className="summary-icon-box icon-red">
              <Siren size={22} />
            </div>
            <div className="summary-card-content">
              <div className="summary-val red">{formatCurrency(summary.totalOverdue)}</div>
              <div className="summary-title">Vencido</div>
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
            </div>
          </div>
        )}
      </div>

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
          background-color: rgba(14, 165, 233, 0.12);
          color: #0284c7;
        }

        .summary-icon-box.icon-amber {
          background-color: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }

        .summary-icon-box.icon-green {
          background-color: rgba(0, 242, 157, 0.12);
          color: #00F29D;
          border: 1px solid rgba(0, 242, 157, 0.25);
        }

        .summary-icon-box.icon-orange {
          background-color: rgba(249, 115, 22, 0.12);
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.25);
        }

        .summary-icon-box.icon-red {
          background-color: rgba(255, 56, 92, 0.12);
          color: #ff385c;
          border: 1px solid rgba(255, 56, 92, 0.25);
        }

        .summary-card-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .summary-val {
          font-family: var(--font-heading);
          font-size: 19px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.3px;
        }

        .summary-val.default { color: var(--text-primary); }
        .summary-val.amber { color: #fbbf24; }
        .summary-val.green { color: #00F29D; }
        .summary-val.orange { color: #f97316; }
        .summary-val.red { color: #ff385c; }

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
          background: linear-gradient(135deg, #00F29D 0%, #00D68A 100%);
          color: #070A12;
          box-shadow: 0 4px 12px rgba(0, 242, 157, 0.25);
        }

        .alert-banner {
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.25);
          color: #fbbf24;
          padding: 14px 16px;
          border-radius: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease, background-color 0.2s ease;
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
          background: linear-gradient(135deg, #1E293B, #0F172A);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38BDF8;
        }
        .green-gradient { 
          background: linear-gradient(135deg, #064E3B, #065F46);
          border: 1px solid rgba(0, 242, 157, 0.35);
          color: #00F29D;
        }
        .orange-gradient { 
          background: linear-gradient(135deg, #451A03, #78350F);
          border: 1px solid rgba(251, 191, 36, 0.25);
          color: #FBBF24;
        }
        .purple-gradient { 
          background: linear-gradient(135deg, #2E1065, #4C1D95);
          border: 1px solid rgba(168, 85, 247, 0.25);
          color: #C084FC;
        }
      `}</style>
    </div>
  );
};
