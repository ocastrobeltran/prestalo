import React, { useState } from 'react';
import type { Installment, Client } from '../types';
import { formatCurrency, isOverdue } from '../services/loanCalculator';
import { Check, ChevronLeft, ChevronRight, MessageSquare, Sparkles } from 'lucide-react';
import { Badge } from '../components/common/Badge';

interface CalendarProps {
  installments: Installment[];
  clients: Client[];
  onPayInstallment: (installmentId: string) => void;
}

type CalendarViewMode = 'hoy' | 'mes' | '7d';
type FilterStatus = 'all' | 'pending' | 'overdue' | 'paid';

export const Calendar: React.FC<CalendarProps> = ({ installments, clients, onPayInstallment }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('mes');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  // Fecha seleccionada para filtrar
  const [selectedDate, setSelectedDate] = useState(() => new Date('2026-07-04T12:00:00')); // Fecha fija inicial basada en las capturas (4 de Julio de 2026)

  // Mes de visualización del calendario
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // Julio (0-indexed, 6 = julio)

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Incrementar/decrementar mes
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Obtener lista de cuotas filtradas según la vista seleccionada
  const getFilteredInstallments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    let result = installments;

    // 1. Filtrar por período/vista
    if (viewMode === 'hoy') {
      result = installments.filter(i => i.dueDate === selectedDateStr);
    } else if (viewMode === '7d') {
      const sevenDaysLater = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      result = installments.filter(i => i.dueDate >= selectedDateStr && i.dueDate <= sevenDaysLater);
    } else if (viewMode === 'mes') {
      // Filtrar por la fecha específica seleccionada en la grilla mensual
      result = installments.filter(i => i.dueDate === selectedDateStr);
    }

    // 2. Filtrar por estado
    if (filterStatus === 'pending') {
      result = result.filter(i => i.status === 'pending');
    } else if (filterStatus === 'overdue') {
      result = result.filter(i => i.status === 'pending' && i.dueDate < todayStr);
    } else if (filterStatus === 'paid') {
      result = result.filter(i => i.status === 'paid');
    }

    return result;
  };

  // Metricas del período actual de visualización
  const getPeriodMetrics = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    let periodInstallments = installments;

    if (viewMode === 'hoy') {
      periodInstallments = installments.filter(i => i.dueDate === selectedDateStr);
    } else if (viewMode === '7d') {
      const sevenDaysLater = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      periodInstallments = installments.filter(i => i.dueDate >= selectedDateStr && i.dueDate <= sevenDaysLater);
    } else if (viewMode === 'mes') {
      // Para métricas del mes completo visible
      const yearMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      periodInstallments = installments.filter(i => i.dueDate.startsWith(yearMonthPrefix));
    }

    const total = periodInstallments.length;
    const paid = periodInstallments.filter(i => i.status === 'paid').length;
    const overdue = periodInstallments.filter(i => i.status === 'pending' && i.dueDate < todayStr).length;
    const pending = total - paid - overdue;
    const totalAmount = periodInstallments.reduce((acc, curr) => acc + curr.amount, 0);

    return { total, paid, overdue, pending, totalAmount };
  };

  const metrics = getPeriodMetrics();

  // Generar matriz de días para el calendario mensual
  const generateMonthDays = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Días del mes anterior para rellenar
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: prevMonthTotalDays - i,
        isCurrentMonth: false,
        dateStr: `${currentMonth === 0 ? currentYear - 1 : currentYear}-${String(currentMonth === 0 ? 12 : currentMonth).padStart(2, '0')}-${String(prevMonthTotalDays - i).padStart(2, '0')}`
      });
    }

    // Días del mes actual
    const currentMonthDays = [];
    for (let i = 1; i <= totalDays; i++) {
      currentMonthDays.push({
        day: i,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    // Días del mes siguiente para completar la grilla de 6 filas (42 días)
    const remainingSlots = 42 - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = [];
    for (let i = 1; i <= remainingSlots; i++) {
      nextMonthDays.push({
        day: i,
        isCurrentMonth: false,
        dateStr: `${currentMonth === 11 ? currentYear + 1 : currentYear}-${String(currentMonth === 11 ? 1 : currentMonth + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const monthDays = generateMonthDays();

  // Obtener cuotas agrupadas por día para dibujar dots en la grilla mensual
  const getInstallmentsForDate = (dateStr: string) => {
    return installments.filter(i => i.dueDate === dateStr);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(new Date(dateStr + 'T12:00:00'));
  };

  const handleMarkAsPaid = (id: string) => {
    onPayInstallment(id);
  };

  const handleSendReminder = (inst: Installment) => {
    const client = clients.find(c => c.id === inst.clientId);
    const message = `Hola ${inst.clientName}, te recordamos que tienes una cuota pendiente del crédito.
*Monto:* ${formatCurrency(inst.amount)}
*Vencimiento:* ${inst.dueDate}
Por favor, realiza el pago o ponte en contacto para registrar tu abono. ¡Gracias!`;
    const url = `https://api.whatsapp.com/send?phone=${client?.phone || ''}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const filteredInstallmentsList = getFilteredInstallments();
  const selectedDateFormatted = selectedDate.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="calendar-page-container animate-fade-in">
      {/* 1. Tarjeta de Resumen del Período */}
      <div className="period-summary-card shadow-sm">
        <h4 className="summary-title">
          {viewMode === 'hoy' ? 'Resumen de hoy' : 
           viewMode === '7d' ? 'Resumen: próximos 7 días' : 
           `Resumen del mes (${monthNames[currentMonth]})`}
        </h4>
        <div className="summary-stats-grid">
          <div className="summary-stat-box">
            <span className="summary-val">{metrics.total}</span>
            <span className="summary-lbl">Total Cuotas</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-val red">{metrics.overdue}</span>
            <span className="summary-lbl">Vencidas</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-val orange">{metrics.pending}</span>
            <span className="summary-lbl">Pendientes</span>
          </div>
          <div className="summary-stat-box">
            <span className="summary-val green">{metrics.paid}</span>
            <span className="summary-lbl">Pagadas</span>
          </div>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-total-row">
          <span>Total a Cobrar</span>
          <span className="font-semibold text-lg">{formatCurrency(metrics.totalAmount)}</span>
        </div>
      </div>

      {/* 2. Selector de Vistas del Calendario */}
      <div className="calendar-views-wrapper card shadow-sm">
        <h5 className="section-subtitle">Vista del Calendario</h5>
        <div className="views-btns-row">
          <button 
            className={`view-toggle-btn ${viewMode === 'hoy' ? 'active' : ''}`}
            onClick={() => setViewMode('hoy')}
          >
            📋 Hoy
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'mes' ? 'active' : ''}`}
            onClick={() => setViewMode('mes')}
          >
            📅 Mes
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === '7d' ? 'active' : ''}`}
            onClick={() => setViewMode('7d')}
          >
            ⏰ Próximos 7d
          </button>
        </div>

        {/* Filtros de Estado */}
        <h5 className="section-subtitle mt-12">Filtrar por Estado</h5>
        <div className="filter-btns-row">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            📋 Todos
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            ⏳ Pendientes
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'overdue' ? 'active' : ''}`}
            onClick={() => setFilterStatus('overdue')}
          >
            ⚠️ Vencidas
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'paid' ? 'active' : ''}`}
            onClick={() => setFilterStatus('paid')}
          >
            ✓ Pagadas
          </button>
        </div>
      </div>

      {/* 3. Grilla del Calendario Mensual */}
      {viewMode === 'mes' && (
        <div className="monthly-grid-card card shadow-sm animate-scale-in">
          <div className="monthly-grid-header">
            <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
            <h4 className="month-year-label">{monthNames[currentMonth]} {currentYear}</h4>
            <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={18} /></button>
          </div>

          <div className="calendar-weekdays">
            {dayNames.map(name => (
              <span key={name} className="weekday-lbl">{name}</span>
            ))}
          </div>

          <div className="calendar-days-grid">
            {monthDays.map((dayObj, index) => {
              const isSelected = selectedDate.toISOString().split('T')[0] === dayObj.dateStr;
              const dateInstallments = getInstallmentsForDate(dayObj.dateStr);
              const pendingCount = dateInstallments.filter(i => i.status === 'pending').length;

              return (
                <div 
                  key={index} 
                  className={`calendar-day-cell ${dayObj.isCurrentMonth ? '' : 'other-month'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDayClick(dayObj.dateStr)}
                >
                  <span className="day-number">{dayObj.day}</span>
                  {pendingCount > 0 && (
                    <span className="day-badge-count">
                      {pendingCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Lista de Cobros del Período / Día Seleccionado */}
      <div className="day-installments-section">
        <h4 className="section-title">
          {viewMode === 'mes' ? `Cobros del ${selectedDateFormatted}` : 
           viewMode === 'hoy' ? `Cobros de Hoy (${selectedDateFormatted})` : 
           `Cobros Próximos 7 días (${metrics.total} cuotas)`}
        </h4>

        {filteredInstallmentsList.length === 0 ? (
          <div className="empty-state-card shadow-sm animate-scale-in">
            <Sparkles className="empty-icon success" size={32} />
            <h4>¡Día libre!</h4>
            <p>No tienes cobros programados para este período.</p>
          </div>
        ) : (
          <div className="installments-list-wrap">
            {filteredInstallmentsList.map((inst) => {
              const isOverdueInst = inst.status === 'pending' && isOverdue(inst.dueDate);
              
              return (
                <div key={inst.id} className="installment-cobro-card shadow-sm animate-slide-up">
                  <div className="cobro-header-row">
                    <div className="cobro-header-left">
                      <h4 className="cobro-title">Cuota #{inst.number}</h4>
                      <span className="cobro-client-name">{inst.clientName}</span>
                    </div>
                    <Badge 
                      status={inst.status === 'paid' ? 'paid' : (isOverdueInst ? 'overdue' : 'pending')} 
                      text={inst.status === 'paid' ? 'Pagada' : (isOverdueInst ? 'Vencida' : 'Pendiente')}
                    />
                  </div>

                  <div className="cobro-financial-split">
                    <div className="cobro-val-row">
                      <span className="lbl">Monto de Cuota:</span>
                      <span className="val primary">{formatCurrency(inst.amount)}</span>
                    </div>
                    <div className="cobro-details-row">
                      <span>Capital: {formatCurrency(inst.capitalAmount)}</span>
                      <span>Interés: {formatCurrency(inst.interestAmount)}</span>
                    </div>
                    <div className="cobro-date-row">
                      <span>Vence: {inst.dueDate}</span>
                      {inst.paidDate && <span className="success">Pagado el: {inst.paidDate}</span>}
                    </div>
                  </div>

                  {inst.status === 'pending' && (
                    <div className="cobro-actions-row">
                      <button 
                        className="cobro-action-btn pay"
                        onClick={() => handleMarkAsPaid(inst.id)}
                      >
                        <Check size={16} />
                        Marcar como pagada
                      </button>
                      <button 
                        className="cobro-action-btn whatsapp"
                        onClick={() => handleSendReminder(inst)}
                        title="Enviar recordatorio"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .calendar-page-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .period-summary-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .summary-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .summary-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
        }

        .summary-stat-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .summary-val {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .summary-val.red { color: var(--danger); }
        .summary-val.orange { color: var(--warning); }
        .summary-val.green { color: var(--success); }

        .summary-lbl {
          font-size: 9px;
          color: var(--text-tertiary);
        }

        .summary-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 12px 0;
        }

        .summary-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);
          align-items: center;
        }

        .text-lg {
          font-size: 20px;
          color: var(--text-primary);
        }

        .calendar-views-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-subtitle {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .mt-12 {
          margin-top: 12px;
        }

        .views-btns-row {
          display: flex;
          gap: 8px;
        }

        .view-toggle-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .view-toggle-btn.active {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .filter-btns-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .filter-btn {
          padding: 6px 12px;
          border-radius: 20px;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          border: 1px solid var(--border-color);
        }

        .filter-btn.active {
          background-color: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .monthly-grid-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .monthly-grid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-btn {
          height: 32px;
          width: 32px;
          border-radius: 50%;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .month-year-label {
          font-size: 15px;
          font-weight: 700;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
        }

        .weekday-lbl {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
        }

        .calendar-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }

        .calendar-day-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          background-color: var(--bg-app);
          transition: background-color 0.2s;
        }

        .calendar-day-cell:hover {
          background-color: var(--border-color);
        }

        .calendar-day-cell.other-month {
          opacity: 0.35;
        }

        .calendar-day-cell.selected {
          background-color: var(--primary) !important;
          color: white;
        }

        .day-number {
          font-size: 13px;
          font-weight: 600;
        }

        .day-badge-count {
          position: absolute;
          bottom: 2px;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background-color: var(--warning);
          color: white;
          font-size: 8px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .day-installments-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .empty-state-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .empty-icon.success {
          color: var(--success);
        }

        .empty-state-card p {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .installments-list-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .installment-cobro-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cobro-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .cobro-header-left {
          display: flex;
          flex-direction: column;
        }

        .cobro-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cobro-client-name {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .cobro-financial-split {
          background-color: var(--bg-app);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .cobro-val-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .cobro-val-row .val.primary {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 800;
          color: var(--primary);
        }

        .cobro-details-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .cobro-date-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary);
          border-top: 1px solid var(--border-color);
          padding-top: 4px;
          margin-top: 2px;
        }

        .cobro-actions-row {
          display: flex;
          gap: 10px;
        }

        .cobro-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
        }

        .cobro-action-btn.pay {
          flex: 1;
          background-color: var(--success);
          color: white;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
        }

        .cobro-action-btn.whatsapp {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </div>
  );
};
