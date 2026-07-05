import React, { useState, useEffect } from 'react';
import { Sun, Moon, Database, RefreshCw, Smartphone, Cloud, CloudOff, LogOut } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import { supabase } from '../../services/supabaseClient';
import type { SyncStatus } from '../../services/supabaseSyncService';

interface HeaderProps {
  activeTab: string;
  onDataRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onDataRefresh }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });
  const [showBackupMenu, setShowBackupMenu] = useState(false);
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
      case 'calendario': return 'Calendario';
      case 'reportes': return 'Reportes';
      default: return 'Prestalo';
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Está seguro de restablecer los datos de prueba? Se perderán todos sus cambios.')) {
      storageService.initializeData(true);
      onDataRefresh();
      setShowBackupMenu(false);
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
    setShowBackupMenu(false);
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
    setShowBackupMenu(false);
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
      alert('¡Sincronización con Supabase completada!');
    } else {
      alert('Sin conexión o error al conectar con Supabase (Modo Local activo).');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Está seguro de cerrar sesión?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <header className="header no-print">
      <div className="header-left">
        <h1 className="header-title">{getTitle()}</h1>
      </div>
      
      <div className="header-right">
        {isInstallable && (
          <button 
            className="header-btn install-btn" 
            onClick={handleInstallApp}
            title="Instalar como Aplicación PWA"
          >
            <Smartphone size={20} />
          </button>
        )}
        
        <button
          className={`header-btn sync-badge ${syncStatus}`}
          onClick={handleSyncNow}
          title={
            syncStatus === 'synced' ? 'Sincronizado con Supabase (Clic para actualizar)' :
            syncStatus === 'syncing' ? 'Sincronizando con la nube...' :
            syncStatus === 'offline' ? 'Sin conexión (Modo Local Offline)' :
            'Error de sincronización con la nube'
          }
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw size={18} className="spin" />
          ) : syncStatus === 'synced' ? (
            <Cloud size={18} style={{ color: '#10b981' }} />
          ) : syncStatus === 'offline' ? (
            <CloudOff size={18} style={{ color: '#94a3b8' }} />
          ) : (
            <Cloud size={18} style={{ color: '#ef4444' }} />
          )}
        </button>
        
        <button 
          className="header-btn" 
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Activar Modo Claro" : "Activar Modo Oscuro"}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          className="header-btn logout-btn" 
          onClick={handleLogout}
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
        </button>

        <div className="backup-dropdown-container">
          <button 
            className={`header-btn ${showBackupMenu ? 'active' : ''}`} 
            onClick={() => setShowBackupMenu(!showBackupMenu)}
            title="Copias de Seguridad"
          >
            <Database size={20} />
          </button>

          {showBackupMenu && (
            <div className="backup-dropdown animate-scale-in">
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
              <div className="dropdown-divider"></div>
              <button onClick={handleResetData} className="dropdown-item danger">
                <RefreshCw size={14} className="spin-on-hover" />
                Cargar Datos Semilla
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .header {
          height: 60px;
          background-color: var(--bg-container);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          position: sticky;
          top: 0;
          z-index: 90;
          transition: background-color 0.3s, border-color 0.3s;
        }

        .header-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .header-btn {
          height: 38px;
          width: 38px;
          border-radius: 50%;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, color 0.2s;
        }

        .header-btn:hover {
          background-color: var(--border-color);
          color: var(--text-primary);
        }

        .logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.1) !important;
          color: var(--danger) !important;
        }

        .header-btn.active {
          background-color: var(--primary);
          color: white;
        }

        .install-btn {
          color: var(--primary);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(14, 165, 233, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
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
          top: 46px;
          width: 220px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 105;
        }

        .dropdown-item {
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: 8px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .dropdown-item:hover {
          background-color: var(--bg-app);
          color: var(--text-primary);
        }

        .dropdown-item.danger {
          color: var(--danger);
        }

        .dropdown-item.danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
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
