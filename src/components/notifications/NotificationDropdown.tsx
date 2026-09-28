import React, { useEffect, useRef } from 'react';
import { 
  BellRing, 
  BellOff, 
  CheckCheck, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  X, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import type { AppNotificationItem } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotificationItem[];
  permissionStatus: 'granted' | 'denied' | 'prompt';
  onRequestPermission: () => Promise<void>;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: AppNotificationItem) => void;
  onViewCalendar: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  permissionStatus,
  onRequestPermission,
  onMarkAllAsRead,
  onSelectNotification,
  onViewCalendar
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape o clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatNotificationTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Ahora mismo';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return `Hoy ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  const getIconForType = (type: AppNotificationItem['type']) => {
    switch (type) {
      case 'today_due':
        return (
          <div className="notif-item-icon-box today">
            <Calendar size={17} />
          </div>
        );
      case 'overdue':
        return (
          <div className="notif-item-icon-box overdue">
            <AlertTriangle size={17} />
          </div>
        );
      case 'tomorrow_due':
        return (
          <div className="notif-item-icon-box tomorrow">
            <Clock size={17} />
          </div>
        );
      default:
        return (
          <div className="notif-item-icon-box system">
            <Sparkles size={17} />
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop para móviles */}
      <div className="notif-backdrop" onClick={onClose} aria-hidden="true" />

      <div 
        ref={dropdownRef} 
        className="notif-dropdown-container animate-scale-in"
        role="dialog"
        aria-label="Centro de Notificaciones"
        aria-modal="true"
      >
        {/* Cabecera del Panel */}
        <div className="notif-header">
          <div className="notif-header-title-group">
            <div className="notif-header-icon-wrap">
              <BellRing size={18} className="notif-header-icon" />
            </div>
            <span className="notif-header-title">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="notif-unread-badge">
                {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
              </span>
            )}
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button 
                type="button"
                className="notif-read-all-btn"
                onClick={onMarkAllAsRead}
                title="Marcar todas como leídas"
              >
                <CheckCheck size={14} />
                <span className="notif-read-all-text">Leídas</span>
              </button>
            )}
            <button 
              type="button"
              className="notif-close-btn"
              onClick={onClose}
              aria-label="Cerrar notificaciones"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Banner para activar permisos Push si aún no están dados */}
        {permissionStatus !== 'granted' && (
          <div className="notif-permission-banner">
            <div className="notif-perm-content">
              <ShieldAlert size={20} className="notif-perm-icon" />
              <div className="notif-perm-text">
                <strong>Activar alertas automáticas</strong>
                <p>Recibe avisos de cobros del día y cuotas en mora aunque la app esté cerrada.</p>
              </div>
            </div>
            <button 
              type="button"
              className="notif-activate-perm-btn"
              onClick={onRequestPermission}
            >
              Activar Notificaciones Push
            </button>
          </div>
        )}

        {/* Lista de Notificaciones */}
        <div className="notif-list-scroll">
          {notifications.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon-wrap">
                <BellOff size={28} />
              </div>
              <h4 className="notif-empty-title">Sin notificaciones pendientes</h4>
              <p className="notif-empty-desc">
                Te avisaremos aquí de tus cobros programados, recordatorios anticipados y cuotas en mora.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={`notif-item ${!item.read ? 'unread' : ''}`}
                onClick={() => onSelectNotification(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNotification(item);
                  }
                }}
              >
                {getIconForType(item.type)}
                <div className="notif-item-body">
                  <div className="notif-item-top">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-time">{formatNotificationTime(item.timestamp)}</span>
                  </div>
                  <p className="notif-item-text">{item.body}</p>
                </div>
                {!item.read && <span className="notif-unread-dot" aria-label="No leída" />}
              </div>
            ))
          )}
        </div>

        {/* Pie de Panel con Acceso Directo a Calendario */}
        <div className="notif-footer">
          <button 
            type="button"
            className="notif-footer-calendar-btn"
            onClick={onViewCalendar}
          >
            <Calendar size={16} />
            <span>Ver Cobros en Calendario</span>
            <ArrowRight size={15} className="arrow-icon" />
          </button>
        </div>
      </div>

      <style>{`
        .notif-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 98;
          display: none;
        }

        @media (max-width: 640px) {
          .notif-backdrop {
            display: block;
            z-index: 998;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
        }

        .notif-dropdown-container {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 380px;
          max-width: calc(100vw - 24px);
          background-color: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: 20px;
          box-shadow: 0 16px 40px -4px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border-color);
          z-index: 100;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: notifSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes notifSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .notif-dropdown-container {
            position: fixed;
            top: calc(64px + env(safe-area-inset-top));
            left: 12px;
            right: 12px;
            margin: 0 auto;
            width: auto;
            max-width: 440px;
            max-height: calc(100vh - 120px - env(safe-area-inset-top));
            max-height: calc(100dvh - 120px - env(safe-area-inset-top));
            border-radius: 22px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1.5px var(--border-color);
            z-index: 999;
            animation: notifDropSheet 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes notifDropSheet {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }

        .notif-header {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1.5px solid var(--border-color);
          background-color: var(--bg-card);
          flex-shrink: 0;
        }

        .notif-header-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .notif-header-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }

        .notif-header-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.2px;
          white-space: nowrap;
        }

        .notif-unread-badge {
          font-size: 11px;
          font-weight: 700;
          background: rgba(var(--primary-rgb), 0.15);
          color: var(--primary);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(var(--primary-rgb), 0.3);
          white-space: nowrap;
        }

        .notif-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .notif-read-all-btn {
          height: 32px;
          padding: 0 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notif-read-all-btn:hover {
          color: var(--primary);
          border-color: rgba(var(--primary-rgb), 0.4);
          background: rgba(var(--primary-rgb), 0.08);
        }

        .notif-close-btn {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .notif-close-btn:hover {
          color: var(--text-primary);
          border-color: var(--text-tertiary);
          background: var(--bg-card);
        }

        .notif-permission-banner {
          background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(56, 189, 248, 0.08));
          border-bottom: 1.5px solid var(--border-color);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }

        .notif-perm-content {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .notif-perm-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notif-perm-text strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .notif-perm-text p {
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-top: 2px;
        }

        .notif-activate-perm-btn {
          min-height: 40px;
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          font-size: 12.5px;
          font-weight: 800;
          border: none;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 12px var(--primary-glow);
          transition: transform 0.15s ease, filter 0.2s ease;
        }

        .notif-activate-perm-btn:active {
          transform: scale(0.97);
        }

        .notif-list-scroll {
          max-height: 380px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }

        .notif-empty-state {
          padding: 36px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .notif-empty-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          margin-bottom: 2px;
        }

        .notif-empty-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .notif-empty-desc {
          font-size: 12px;
          color: var(--text-secondary);
          max-width: 260px;
          line-height: 1.45;
        }

        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background-color 0.15s ease;
          position: relative;
          text-align: left;
          user-select: none;
        }

        .notif-item:last-child {
          border-bottom: none;
        }

        .notif-item:hover,
        .notif-item:focus-visible {
          background-color: var(--bg-elevated);
          outline: none;
        }

        .notif-item.unread {
          background-color: rgba(var(--primary-rgb), 0.05);
        }

        .notif-item-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .notif-item-icon-box.today {
          background: rgba(var(--primary-rgb), 0.14);
          color: var(--primary);
          border: 1px solid rgba(var(--primary-rgb), 0.3);
        }

        .notif-item-icon-box.overdue {
          background: rgba(var(--danger-rgb), 0.14);
          color: var(--danger);
          border: 1px solid rgba(var(--danger-rgb), 0.3);
        }

        .notif-item-icon-box.tomorrow {
          background: rgba(var(--info-rgb), 0.14);
          color: var(--info);
          border: 1px solid rgba(var(--info-rgb), 0.3);
        }

        .notif-item-icon-box.system {
          background: rgba(var(--accent-purple-rgb), 0.14);
          color: var(--accent-purple);
          border: 1px solid rgba(var(--accent-purple-rgb), 0.3);
        }

        .notif-item-body {
          flex: 1;
          min-width: 0;
          padding-right: 12px;
        }

        .notif-item-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .notif-item-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-item-time {
          font-size: 11px;
          color: var(--text-tertiary);
          flex-shrink: 0;
          font-weight: 500;
        }

        .notif-item-text {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.45;
          margin: 0;
          word-break: break-word;
        }

        .notif-unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 6px var(--primary-glow);
          position: absolute;
          top: 18px;
          right: 14px;
        }

        .notif-footer {
          padding: 12px 16px;
          border-top: 1.5px solid var(--border-color);
          background-color: var(--bg-card);
          flex-shrink: 0;
        }

        .notif-footer-calendar-btn {
          width: 100%;
          min-height: 44px;
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notif-footer-calendar-btn:hover {
          background: rgba(var(--primary-rgb), 0.12);
          border-color: rgba(var(--primary-rgb), 0.4);
          color: var(--primary);
        }

        .notif-footer-calendar-btn .arrow-icon {
          transition: transform 0.2s;
        }

        .notif-footer-calendar-btn:hover .arrow-icon {
          transform: translateX(4px);
        }
      `}</style>
    </>
  );
};
