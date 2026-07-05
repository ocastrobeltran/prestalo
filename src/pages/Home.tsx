import React, { useState } from 'react';
import type { Client, Loan, Installment, CapitalBox } from '../types';
import { formatCurrency } from '../services/loanCalculator';
import { TrendingUp, Users, DollarSign, Wallet, Calendar, FileText, ChevronRight, UserPlus, FilePlus } from 'lucide-react';

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
  const paidInstallments = installments.filter(i => i.status === 'paid');
  const totalInstallmentsCount = installments.length;
  const recoveryRate = totalInstallmentsCount > 0 
    ? (paidInstallments.length / totalInstallmentsCount) * 100 
    : 0;

  // Resumen Financiero
  const totalCapitalLent = loans.reduce((acc, curr) => acc + curr.capital, 0);
  const totalAmountPaid = installments
    .filter(i => i.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  // Pendiente en la calle = Total a Pagar original - Total Pagado
  const totalOriginalAmountToPay = loans.reduce((acc, curr) => acc + curr.totalToPay, 0);
  const totalAmountPending = Math.max(totalOriginalAmountToPay - totalAmountPaid, 0);

  // Capital e interés pendiente desglosado
  const pendingCapital = installments
    .filter(i => i.status !== 'paid')
    .reduce((acc, curr) => acc + curr.capitalAmount, 0);
  const pendingInterest = installments
    .filter(i => i.status !== 'paid')
    .reduce((acc, curr) => acc + curr.interestAmount, 0);

  // Próximos cobros en los siguientes 7 días (excluyendo domingos o no)
  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const upcomingPaymentsCount = installments.filter(
    i => i.status === 'pending' && i.dueDate >= todayStr && i.dueDate <= next7DaysStr
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
          <Wallet size={20} className="icon-orange" />
          <h3>Resumen Financiero</h3>
        </div>
        
        <div className="financial-totals">
          <div className="financial-item">
            <div className="financial-lbl">Capital Prestado</div>
            <div className="financial-val">{formatCurrency(totalCapitalLent)}</div>
          </div>
          
          <div className="financial-item border-top">
            <div className="financial-lbl">Recuperado (Capital + Intereses)</div>
            <div className="financial-val success">{formatCurrency(totalAmountPaid)}</div>
          </div>

          <div className="financial-item border-top">
            <div className="financial-lbl">Pendiente (En la Calle)</div>
            <div className="financial-val warning">{formatCurrency(totalAmountPending)}</div>
            <div className="financial-subtext">
              Capital: {formatCurrency(pendingCapital)} · Intereses: {formatCurrency(pendingInterest)}
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

        .financial-totals {
          display: flex;
          flex-direction: column;
        }

        .financial-item {
          padding: 10px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .financial-item:first-child {
          padding-top: 0;
        }

        .financial-item:last-child {
          padding-bottom: 0;
        }

        .financial-item.border-top {
          border-top: 1px solid var(--border-color);
        }

        .financial-lbl {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .financial-val {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .financial-val.success { color: var(--success); }
        .financial-val.warning { color: var(--warning); }

        .financial-subtext {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }

        .card-header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .text-btn {
          font-size: 13px;
          font-weight: 600;
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
        }

        .capital-val-large {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
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
        }

        .sub-val {
          font-size: 14px;
          font-weight: 700;
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
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-input);
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
        }

        .capital-form-btns {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .capital-form-btns button {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
        }

        .btn-cancel {
          background-color: var(--border-color);
          color: var(--text-secondary);
        }

        .btn-save {
          background-color: var(--primary);
          color: white;
        }

        .alert-banner {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: var(--warning);
          padding: 14px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .alert-banner:hover {
          transform: scale(1.01);
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
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .quick-btn-card {
          height: 100px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          color: white;
          box-shadow: var(--shadow-md);
          padding: 12px;
          text-align: center;
        }

        .quick-btn-card span {
          font-size: 13px;
          font-weight: 700;
        }

        .blue-gradient { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
        .green-gradient { background: linear-gradient(135deg, #10b981, #059669); }
        .orange-gradient { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .purple-gradient { background: linear-gradient(135deg, #a855f7, #7c3aed); }
      `}</style>
    </div>
  );
};
