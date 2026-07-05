import React, { useState } from 'react';
import type { Client, Loan, Installment, CapitalBox, CapitalTransaction } from '../types';
import { formatCurrency } from '../services/loanCalculator';
import { BarChart3, TrendingUp, Users, Printer } from 'lucide-react';
import { ProgressBar } from '../components/common/ProgressBar';

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface ReportsProps {
  clients: Client[];
  loans: Loan[];
  installments: Installment[];
  capitalBox: CapitalBox;
  transactions: CapitalTransaction[];
}

type PeriodMode = 'hoy' | 'semana' | 'mes';

export const Reports: React.FC<ReportsProps> = ({
  clients,
  loans,
  installments,
  capitalBox,
  transactions
}) => {
  const [period, setPeriod] = useState<PeriodMode>('mes');

  // Filtrar préstamos e instalaciones según el período seleccionado
  const getFilteredData = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let filteredInstallments = installments;
    let filteredTransactions = transactions;

    const getWeekRange = () => {
      const today = new Date();
      const first = today.getDate() - today.getDay(); // Primer día de la semana (domingo)
      const last = first + 6;
      const firstDate = new Date(today.setDate(first)).toISOString().split('T')[0];
      const lastDate = new Date(today.setDate(last)).toISOString().split('T')[0];
      return { firstDate, lastDate };
    };

    if (period === 'hoy') {
      filteredInstallments = installments.filter(i => i.dueDate === todayStr);
      filteredTransactions = transactions.filter(t => t.date.startsWith(todayStr));
    } else if (period === 'semana') {
      const { firstDate, lastDate } = getWeekRange();
      filteredInstallments = installments.filter(i => i.dueDate >= firstDate && i.dueDate <= lastDate);
      filteredTransactions = transactions.filter(t => t.date >= firstDate && t.date <= lastDate);
    } else if (period === 'mes') {
      const currentYearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      filteredInstallments = installments.filter(i => i.dueDate.startsWith(currentYearMonth));
      filteredTransactions = transactions.filter(t => t.date.startsWith(currentYearMonth));
    }

    return { filteredInstallments, filteredTransactions };
  };

  const { filteredInstallments, filteredTransactions } = getFilteredData();

  // Calcular métricas
  const capitalPrestadoPeriodo = filteredTransactions
    .filter(t => t.type === 'loan_disbursement')
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const totalCobradoPeriodo = filteredTransactions
    .filter(t => t.type === 'installment_payment')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Desglosar capital vs intereses cobrados en el período
  // Sumamos los capitalAmount y interestAmount correspondientes a las cuotas pagadas en este período
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = new Date().toISOString().substring(0, 7);
  
  let paidInstallmentsInPeriod = installments.filter(i => i.status === 'paid');
  if (period === 'hoy') {
    paidInstallmentsInPeriod = paidInstallmentsInPeriod.filter(i => i.paidDate === todayStr);
  } else if (period === 'semana') {
    const today = new Date();
    const first = today.getDate() - today.getDay();
    const firstDate = new Date(today.setDate(first)).toISOString().split('T')[0];
    const lastDate = new Date(today.setDate(first + 6)).toISOString().split('T')[0];
    paidInstallmentsInPeriod = paidInstallmentsInPeriod.filter(i => i.paidDate && i.paidDate >= firstDate && i.paidDate <= lastDate);
  } else if (period === 'mes') {
    paidInstallmentsInPeriod = paidInstallmentsInPeriod.filter(i => i.paidDate && i.paidDate.startsWith(currentYearMonth));
  }

  const capitalRecuperadoPeriodo = paidInstallmentsInPeriod.reduce((acc, curr) => acc + curr.capitalAmount, 0);
  const interesesRecuperadosPeriodo = paidInstallmentsInPeriod.reduce((acc, curr) => acc + curr.interestAmount, 0);

  // Totales generales para métricas de "Cierre"
  const totalOriginalToPayOverall = loans.reduce((acc, curr) => acc + curr.totalToPay, 0);
  const totalPaidOverall = installments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const enCalleOverall = Math.max(totalOriginalToPayOverall - totalPaidOverall, 0);

  // Tasa de recuperación del período
  const paidCount = filteredInstallments.filter(i => i.status === 'paid').length;
  const totalCount = filteredInstallments.length;
  const recoveryRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  // Tasa de mora del período
  const overdueCount = filteredInstallments.filter(i => i.status === 'pending' && i.dueDate < todayStr).length;
  const overdueRate = totalCount > 0 ? (overdueCount / totalCount) * 100 : 0;

  // Margen de ganancia y tasa promedio
  const avgInterestRate = loans.length > 0
    ? loans.reduce((acc, curr) => acc + curr.interestRate, 0) / loans.length
    : 0;

  // Métricas de clientes
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const inactiveClients = totalClients - activeClients;

  // Métricas de préstamos
  const totalLoans = loans.length;
  const activeLoans = loans.filter(l => l.status === 'active').length;
  const overdueLoans = loans.filter(l => l.status === 'active' && l.endDate < todayStr).length;

  // Métricas de cuotas
  const totalCuotas = filteredInstallments.length;
  const paidCuotas = filteredInstallments.filter(i => i.status === 'paid').length;
  const overdueCuotas = filteredInstallments.filter(i => i.status === 'pending' && i.dueDate < todayStr).length;

  // Top Clientes
  const getTopClients = () => {
    const clientPayments: { [name: string]: { amount: number, count: number } } = {};
    installments.forEach(inst => {
      if (inst.status === 'paid') {
        if (!clientPayments[inst.clientName]) {
          clientPayments[inst.clientName] = { amount: 0, count: 0 };
        }
        clientPayments[inst.clientName].amount += inst.amount;
        clientPayments[inst.clientName].count += 1;
      }
    });

    return Object.entries(clientPayments)
      .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const topClients = getTopClients();

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="reports-container animate-fade-in">
      {/* Selector de Período */}
      <div className="period-selector-card card shadow-sm no-print">
        <h5 className="section-subtitle">Período de Análisis</h5>
        <div className="period-btns-row">
          <button 
            className={`period-btn ${period === 'hoy' ? 'active' : ''}`}
            onClick={() => setPeriod('hoy')}
          >
            Hoy
          </button>
          <button 
            className={`period-btn ${period === 'semana' ? 'active' : ''}`}
            onClick={() => setPeriod('semana')}
          >
            Semana
          </button>
          <button 
            className={`period-btn ${period === 'mes' ? 'active' : ''}`}
            onClick={() => setPeriod('mes')}
          >
            Mes
          </button>
        </div>
        <div className="period-dates">
          {period === 'hoy' && <span>{todayStr}</span>}
          {period === 'semana' && <span>Rango semanal actual</span>}
          {period === 'mes' && <span>Mes: {monthNames[new Date().getMonth()]} {new Date().getFullYear()}</span>}
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="card shadow-sm">
        <div className="reports-section-header">
          <div className="card-header-icon-title">
            <TrendingUp size={20} className="icon-blue" />
            <h3>Resumen Financiero</h3>
          </div>
          <span className="badge-free">SISTEMA COMPLETO</span>
        </div>

        <div className="metrics-box-grid">
          <div className="metric-box shadow-sm">
            <span className="lbl">Capital Prestado</span>
            <span className="val">{formatCurrency(capitalPrestadoPeriodo)}</span>
          </div>

          <div className="metric-box shadow-sm">
            <span className="lbl">Total Cobrado (Cuotas)</span>
            <span className="val success">{formatCurrency(totalCobradoPeriodo)}</span>
            <span className="subtext">
              Capital: {formatCurrency(capitalRecuperadoPeriodo)} <br />
              Interés: {formatCurrency(interesesRecuperadosPeriodo)}
            </span>
          </div>

          <div className="metric-box shadow-sm">
            <span className="lbl">En Calle (General)</span>
            <span className="val warning">{formatCurrency(enCalleOverall)}</span>
          </div>

          <div className="metric-box shadow-sm">
            <span className="lbl">Caja (Disponible)</span>
            <span className="val primary">{formatCurrency(capitalBox.currentCapital)}</span>
          </div>
        </div>
      </div>

      {/* Indicadores Clave */}
      <div className="card shadow-sm">
        <div className="card-header-icon-title">
          <BarChart3 size={20} className="icon-orange" />
          <h3>Indicadores Clave</h3>
        </div>

        <div className="indicators-list">
          <div className="indicator-item">
            <div className="indicator-meta">
              <span className="lbl">Tasa de Recuperación:</span>
              <span className="val">{recoveryRate.toFixed(1)}%</span>
            </div>
            <ProgressBar progress={recoveryRate} color="var(--success)" />
          </div>

          {overdueRate > 0 && (
            <div className="indicator-item">
              <div className="indicator-meta">
                <span className="lbl">Tasa de Mora:</span>
                <span className="val red">{overdueRate.toFixed(1)}%</span>
              </div>
              <ProgressBar progress={overdueRate} color="var(--danger)" />
            </div>
          )}

          <div className="indicator-row">
            <div className="indicator-half">
              <span className="lbl">Tasa Interés Promedio:</span>
              <span className="val font-semibold">{avgInterestRate.toFixed(1)}%</span>
            </div>
            <div className="indicator-half text-right">
              <span className="lbl">Intereses Cobrados:</span>
              <span className="val success font-semibold">{formatCurrency(interesesRecuperadosPeriodo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Generales */}
      <div className="card shadow-sm">
        <div className="card-header-icon-title">
          <Users size={20} className="icon-blue" />
          <h3>Métricas Operativas</h3>
        </div>

        <div className="operational-metrics-table">
          {/* Fila Clientes */}
          <div className="metrics-category">
            <h4>Clientes</h4>
            <div className="metrics-sub-row">
              <div className="sub-metric">Total: <strong>{totalClients}</strong></div>
              <div className="sub-metric">Activos: <strong>{activeClients}</strong></div>
              <div className="sub-metric">Inactivos: <strong>{inactiveClients}</strong></div>
            </div>
          </div>
          
          {/* Fila Préstamos */}
          <div className="metrics-category border-top-dash">
            <h4>Préstamos</h4>
            <div className="metrics-sub-row">
              <div className="sub-metric">Total: <strong>{totalLoans}</strong></div>
              <div className="sub-metric">Activos: <strong>{activeLoans}</strong></div>
              <div className="sub-metric">Mora: <strong className="danger">{overdueLoans}</strong></div>
            </div>
          </div>

          {/* Fila Cuotas */}
          <div className="metrics-category border-top-dash">
            <h4>Cuotas ({period === 'mes' ? 'Este Mes' : period === 'hoy' ? 'Hoy' : 'Esta Semana'})</h4>
            <div className="metrics-sub-row">
              <div className="sub-metric">Total: <strong>{totalCuotas}</strong></div>
              <div className="sub-metric success">Pagadas: <strong>{paidCuotas}</strong></div>
              <div className="sub-metric danger">Vencidas: <strong>{overdueCuotas}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clientes */}
      <div className="card shadow-sm">
        <h3 className="section-title-normal">Top Clientes (Cobrado)</h3>
        {topClients.length === 0 ? (
          <p className="no-data-text">No hay datos de pagos para este período.</p>
        ) : (
          <div className="top-clients-list">
            {topClients.map((c, i) => (
              <div key={i} className="top-client-item">
                <span className="rank-num">#{i+1}</span>
                <span className="client-name">{c.name}</span>
                <span className="client-count">{c.count} cuotas</span>
                <span className="client-amount font-semibold success">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cierre de Caja y Exportación */}
      <div className="card shadow-sm no-print">
        <h3 className="section-title-normal">Exportación y Caja</h3>
        <p className="box-desc">Descarga los reportes y cierres de caja correspondientes a este período para contabilidad externa.</p>
        <div className="caja-actions">
          <button className="caja-btn print" onClick={handlePrintReport}>
            <Printer size={16} />
            Imprimir Reporte del Período
          </button>
        </div>
      </div>

      <style>{`
        .reports-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .period-selector-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .period-btns-row {
          display: flex;
          gap: 8px;
        }

        .period-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          border: 1px solid var(--border-color);
        }

        .period-btn.active {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .period-dates {
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .reports-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .badge-free {
          font-size: 9px;
          font-weight: 800;
          color: var(--primary);
          background-color: rgba(14, 165, 233, 0.1);
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }

        .metrics-box-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .metric-box {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-box .lbl {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .metric-box .val {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .metric-box .val.success { color: var(--success); }
        .metric-box .val.warning { color: var(--warning); }
        .metric-box .val.primary { color: var(--primary); }

        .metric-box .subtext {
          font-size: 9px;
          color: var(--text-tertiary);
          line-height: 1.3;
          margin-top: 2px;
        }

        .indicators-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .indicator-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .indicator-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 600;
        }

        .indicator-meta .lbl {
          color: var(--text-secondary);
        }

        .indicator-meta .val {
          color: var(--text-primary);
        }

        .indicator-meta .val.red { color: var(--danger); }

        .indicator-row {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
          margin-top: 4px;
        }

        .indicator-half {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .indicator-half .lbl {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .indicator-half .val {
          font-size: 14px;
        }

        .operational-metrics-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metrics-category {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metrics-category h4 {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .metrics-sub-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .border-top-dash {
          border-top: 1px dashed var(--border-color);
          padding-top: 10px;
        }

        .section-title-normal {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .top-clients-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .top-client-item {
          display: flex;
          align-items: center;
          padding: 8px 10px;
          background-color: var(--bg-app);
          border-radius: 8px;
          border: 1px solid var(--border-color);
          font-size: 13px;
        }

        .rank-num {
          font-weight: 800;
          color: var(--primary);
          width: 28px;
        }

        .client-name {
          flex: 1;
          font-weight: 500;
          color: var(--text-primary);
        }

        .client-count {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-right: 12px;
        }

        .client-amount {
          text-align: right;
        }

        .box-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 14px;
        }

        .caja-actions {
          display: flex;
        }

        .caja-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          color: white;
        }

        .caja-btn.print {
          background-color: var(--text-primary);
        }

        .text-right {
          text-align: right;
        }

        .no-data-text {
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: center;
          padding: 12px;
        }
      `}</style>
    </div>
  );
};
