import React, { useState, useEffect } from 'react';
import { Sun, Moon, Database, RefreshCw, Smartphone, Cloud, CloudOff, LogOut, Crown, ShieldCheck, FileText, Trash2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import { supabase } from '../../services/supabaseClient';
import type { SyncStatus } from '../../services/supabaseSyncService';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface HeaderProps {
  activeTab: string;
  onDataRefresh: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenDeleteAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onDataRefresh,
  onOpenTerms,
  onOpenPrivacy,
  onOpenDeleteAccount
}) => {
  const { isLaunchFreeMode, isTrialActive, daysRemaining, openPaywall } = useSubscription();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabaseSyncService.getStatus());

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
      default: return 'Prestalo';
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de limpiar los datos locales de este dispositivo?')) {
      storageService.initializeData(true);
      onDataRefresh();
      setShowSettingsMenu(false);
    }
  };

  const handleExportBackup = () => {
    const backupStr = storageService.exportBackup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prestalo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setShowSettingsMenu(false);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
            storageService.importBackup(event.target.result as string);
            alert('¡Respaldo importado correctamente!');
            onDataRefresh();
          }
        } catch (err) {
          alert((err as Error).message);
        }
      };
    }
    setShowSettingsMenu(false);
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
    const ok = await supabaseSyncService.syncDown(() => {
      onDataRefresh();
    });
    if (ok) {
      alert('¡Sincronización con la nube completada!');
    } else {
      alert('Sin conexión o trabajando en Modo Offline.');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Está seguro de cerrar sesión?')) {
      storageService.clearUserData();
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="header no-print">
      <div className="header-left">
        <div className="header-brand-container">
          <img src="/logo.png" alt="Préstalo Logo" className="header-brand-logo" />
          <h1 className="header-title">{getTitle()}</h1>
        </div>
      </div>
      
      <div className="header-right">
        {/* Botón de Membresía PRO (Solo visible si no está en modo lanzamiento gratuito) */}
        {!isLaunchFreeMode && (
          <button 
            className="header-pro-badge"
            onClick={openPaywall}
            title={isTrialActive ? `Prueba VIP: ${daysRemaining} días restantes` : "Membresía Prestalo PRO"}
          >
            <Crown size={14} className="pro-icon" />
            <span>{isTrialActive ? `${daysRemaining}d VIP` : 'PRO'}</span>
          </button>
        )}

        {isInstallable && (
          <button 
            className="header-btn install-btn" 
            onClick={handleInstallApp}
            title="Instalar App"
          >
            <Smartphone size={18} />
          </button>
        )}
        
        <button
          className={`header-btn sync-badge ${syncStatus}`}
          onClick={handleSyncNow}
          title={
            syncStatus === 'synced' ? 'Sincronizado con Supabase (Clic para actualizar)' :
            syncStatus === 'syncing' ? 'Sincronizando con la nube...' :
            syncStatus === 'offline' ? 'Modo Offline (Datos guardados localmente)' :
            'Error de sincronización'
          }
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw size={17} className="spin" />
          ) : syncStatus === 'synced' ? (
            <Cloud size={17} style={{ color: '#00F29D' }} />
          ) : syncStatus === 'offline' ? (
            <CloudOff size={17} style={{ color: '#94a3b8' }} />
          ) : (
            <Cloud size={17} style={{ color: '#ff385c' }} />
          )}
        </button>
        
        <button 
          className="header-btn" 
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="backup-dropdown-container">
          <button 
            className={`header-btn ${showSettingsMenu ? 'active' : ''}`} 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            title="Ajustes y Respaldo"
          >
            <Database size={18} />
          </button>

          {showSettingsMenu && (
            <div className="backup-dropdown animate-scale-in">
              {!isLaunchFreeMode && (
                <>
                  <button onClick={() => { setShowSettingsMenu(false); openPaywall(); }} className="dropdown-item pro-highlight">
                    <Crown size={14} style={{ color: '#00F29D' }} />
                    <span>Membresía PRO</span>
                  </button>
                  <div className="dropdown-divider"></div>
                </>
              )}
              
              <button onClick={handleExportBackup} className="dropdown-item">
                Exportar Respaldo (JSON)
              </button>
              <label className="dropdown-item file-label">
                Importar Respaldo (JSON)
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportBackup} 
                  style={{ display: 'none' }} 
                />
              </label>
              <button onClick={handleResetData} className="dropdown-item">
                <RefreshCw size={14} />
                <span>Restablecer Datos Locales</span>
              </button>

              <div className="dropdown-divider"></div>

              {onOpenTerms && (
                <button onClick={() => { setShowSettingsMenu(false); onOpenTerms(); }} className="dropdown-item">
                  <FileText size={14} />
                  <span>Términos y Condiciones</span>
                </button>
              )}

              {onOpenPrivacy && (
                <button onClick={() => { setShowSettingsMenu(false); onOpenPrivacy(); }} className="dropdown-item">
                  <ShieldCheck size={14} />
                  <span>Política de Privacidad</span>
                </button>
              )}

              <div className="dropdown-divider"></div>

              <button onClick={handleLogout} className="dropdown-item">
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>

              {onOpenDeleteAccount && (
                <button onClick={() => { setShowSettingsMenu(false); onOpenDeleteAccount(); }} className="dropdown-item danger">
                  <Trash2 size={14} />
                  <span>Eliminar Cuenta</span>
                </button>
              )}
            </div>
          )}
        </div>
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
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, #00F29D 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-right {
          display: flex;
          gap: 7px;
          align-items: center;
        }

        .header-pro-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, rgba(0, 242, 157, 0.15), rgba(56, 189, 248, 0.15));
          border: 1px solid rgba(0, 242, 157, 0.4);
          color: #00F29D;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 10px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-pro-badge:active {
          transform: scale(0.92);
        }

        .header-btn {
          height: 34px;
          width: 34px;
          border-radius: 10px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-btn:active {
          transform: scale(0.92);
        }

        .header-btn:hover {
          background-color: var(--bg-elevated);
          color: var(--primary);
          border-color: rgba(0, 242, 157, 0.3);
        }

        .install-btn {
          color: var(--primary);
          border-color: rgba(0, 242, 157, 0.4);
          animation: pulse 2.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 242, 157, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(0, 242, 157, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 242, 157, 0); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .backup-dropdown-container {
          position: relative;
        }

        .backup-dropdown {
          position: absolute;
          right: 0;
          top: 44px;
          width: 230px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: var(--shadow-lg);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          z-index: 105;
        }

        .dropdown-item {
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: 10px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .dropdown-item.pro-highlight {
          color: #00F29D;
          font-weight: 700;
          background: rgba(0, 242, 157, 0.08);
        }

        .dropdown-item:hover {
          background-color: var(--bg-elevated);
          color: var(--text-primary);
        }

        .dropdown-item.danger {
          color: var(--danger);
        }

        .dropdown-item.danger:hover {
          background-color: rgba(255, 56, 92, 0.1);
        }

        .dropdown-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 4px 0;
        }

        .file-label {
          display: block;
        }
      `}</style>
    </header>
  );
};
