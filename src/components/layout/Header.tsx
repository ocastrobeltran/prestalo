import React, { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, RefreshCw, Smartphone, Cloud, CloudOff, User, Bell } from 'lucide-react';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import type { SyncStatus } from '../../services/supabaseSyncService';
import { storageService } from '../../services/storageService';
import { notificationService } from '../../services/notificationService';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import type { AppNotificationItem } from '../../types';

interface HeaderProps {
  activeTab: string;
  onDataRefresh: () => void;
  onOpenProfile: () => void;
  onOpenCalendar?: (filter?: 'all' | 'pending' | 'overdue' | 'paid') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onDataRefresh,
  onOpenProfile,
  onOpenCalendar
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabaseSyncService.getStatus());
  const [isSyncingManual, setIsSyncingManual] = useState(false);

  // Estados de Notificaciones
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Cargar notificaciones e historial
  const loadNotifications = useCallback(() => {
    const history = storageService.getNotificationHistory();
    setNotifications(history);
  }, []);

  // Cargar permisos y notificaciones en montaje y eventos
  useEffect(() => {
    loadNotifications();
    notificationService.checkPermissions().then(status => {
      setPermissionStatus(status);
    });

    const handleNotificationsUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('credipresta_notifications_updated', handleNotificationsUpdate);
    return () => {
      window.removeEventListener('credipresta_notifications_updated', handleNotificationsUpdate);
    };
  }, [loadNotifications]);

  // Suscripción al estado de sincronización Supabase
  useEffect(() => {
    const unsubscribe = supabaseSyncService.subscribeStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Control del tema oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Escuchar evento de instalación PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'inicio': return 'Inicio';
      case 'clientes': return 'Clientes';
      case 'prestamos': return 'Préstamos';
      case 'calendario': return 'Cobros';
      case 'reportes': return 'Métricas';
      case 'perfil': return 'Mi Perfil';
      case 'terminos': return 'Términos de Uso';
      case 'privacidad': return 'Privacidad';
      default: return 'CrediPresta';
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleSyncNow = async () => {
    setIsSyncingManual(true);
    const ok = await supabaseSyncService.syncDown(() => {
      onDataRefresh();
      loadNotifications();
    });
    setIsSyncingManual(false);
    if (ok) {
      alert('¡Sincronización con la nube completada!');
    } else {
      alert('Sin conexión o trabajando en Modo Offline.');
    }
  };

  // Manejadores de Notificaciones
  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    storageService.saveNotificationHistory(updated);
    setNotifications(updated);
  };

  const handleSelectNotification = (item: AppNotificationItem) => {
    const updated = notifications.map(n => n.id === item.id ? { ...n, read: true } : n);
    storageService.saveNotificationHistory(updated);
    setNotifications(updated);
    setIsNotifOpen(false);

    if (item.type === 'overdue') {
      onOpenCalendar?.('overdue');
    } else if (item.type === 'today_due') {
      onOpenCalendar?.('pending');
    } else {
      onOpenCalendar?.();
    }
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setPermissionStatus(granted ? 'granted' : 'denied');
  };

  // Contadores de notificaciones
  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(
    n => !n.read && (n.type === 'today_due' || n.type === 'overdue')
  ).length;

  return (
    <header className="header no-print">
      <div className="header-left">
        <div className="header-brand-container">
          <img src="/logo.png" alt="CrediPresta Logo" className="header-brand-logo" />
          <h1 className="header-title">{getTitle()}</h1>
        </div>
      </div>
      
      <div className="header-right">
        {isInstallable && (
          <button 
            className="header-btn install-btn" 
            onClick={handleInstallApp}
            title="Instalar App"
            aria-label="Instalar Aplicación"
          >
            <Smartphone size={18} />
          </button>
        )}
        
        {/* Indicador de Sincronización en la Nube */}
        <button
          className={`header-btn sync-badge ${syncStatus}`}
          onClick={handleSyncNow}
          disabled={isSyncingManual}
          aria-label="Sincronización en la nube"
          title={
            syncStatus === 'synced' ? 'Sincronizado con la nube (Clic para actualizar)' :
            syncStatus === 'syncing' ? 'Sincronizando con la nube...' :
            syncStatus === 'offline' ? 'Modo Offline (Datos guardados localmente)' :
            'Error de sincronización'
          }
        >
          {syncStatus === 'syncing' || isSyncingManual ? (
            <RefreshCw size={17} className="spin" />
          ) : syncStatus === 'synced' ? (
            <Cloud size={17} style={{ color: 'var(--success)' }} />
          ) : syncStatus === 'offline' ? (
            <CloudOff size={17} style={{ color: '#94a3b8' }} />
          ) : (
            <Cloud size={17} style={{ color: '#ff385c' }} />
          )}
        </button>

        {/* Botón de Notificaciones con Badge */}
        <div className="header-notif-wrapper">
          <button
            className={`header-btn notif-trigger-btn ${isNotifOpen ? 'active' : ''} ${urgentCount > 0 ? 'urgent' : ''}`}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Notificaciones y Recordatorios"
            aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ''}`}
            aria-expanded={isNotifOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={`header-notif-badge ${urgentCount > 0 ? 'urgent' : ''}`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            permissionStatus={permissionStatus}
            onRequestPermission={handleRequestPermission}
            onMarkAllAsRead={handleMarkAllAsRead}
            onSelectNotification={handleSelectNotification}
            onViewCalendar={() => {
              setIsNotifOpen(false);
              onOpenCalendar?.();
            }}
          />
        </div>
        
        {/* Selector de Tema */}
        <button 
          className="header-btn" 
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
          aria-label={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Botón de Acceso a Mi Perfil y Ajustes */}
        <button 
          className={`header-btn profile-btn ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={onOpenProfile}
          title="Mi Perfil y Ajustes"
          aria-label="Mi Perfil y Ajustes"
        >
          <User size={18} />
        </button>
      </div>

      <style>{`
        .header {
          height: calc(62px + env(safe-area-inset-top));
          padding-top: env(safe-area-inset-top);
          padding-left: 16px;
          padding-right: 16px;
          background-color: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 90;
          transition: background-color 0.3s, border-color 0.3s;
        }

        .header-brand-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-brand-logo {
          height: 30px;
          width: 30px;
          object-fit: contain;
          border-radius: 9px;
          background: linear-gradient(135deg, #111828, #1A243C);
          border: 1px solid rgba(0, 242, 157, 0.25);
          box-shadow: 0 0 12px rgba(0, 242, 157, 0.15);
        }

        .header-title {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, #00F29D 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .header-notif-wrapper {
          position: relative;
        }

        .header-btn {
          height: 38px;
          width: 38px;
          min-height: 44px;
          min-width: 44px;
          border-radius: 12px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-btn:active {
          transform: scale(0.92);
        }

        .header-btn:hover {
          background-color: var(--bg-elevated);
          color: var(--primary);
          border-color: rgba(var(--primary-rgb), 0.3);
        }

        .header-btn.active {
          background-color: rgba(var(--primary-rgb), 0.15);
          border-color: rgba(var(--primary-rgb), 0.4);
          color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .notif-trigger-btn.urgent {
          border-color: rgba(var(--danger-rgb), 0.4);
          color: var(--danger);
        }

        .header-notif-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: var(--primary);
          color: var(--btn-primary-text);
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-card);
          box-shadow: 0 0 8px var(--primary-glow);
          pointer-events: none;
        }

        .header-notif-badge.urgent {
          background: var(--danger);
          color: #ffffff;
          box-shadow: 0 0 10px rgba(var(--danger-rgb), 0.5);
          animation: urgentPulse 1.8s infinite;
        }

        @keyframes urgentPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .install-btn {
          color: var(--primary);
          border-color: rgba(var(--primary-rgb), 0.4);
          animation: pulse 2.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(var(--primary-rgb), 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};

