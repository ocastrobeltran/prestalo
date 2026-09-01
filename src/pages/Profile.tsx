import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Phone, 
  Download, 
  Upload, 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  ShieldCheck, 
  FileText, 
  LogOut, 
  AlertTriangle, 
  Save, 
  Check, 
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { supabaseSyncService } from '../services/supabaseSyncService';
import { supabase } from '../services/supabaseClient';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { UserProfile } from '../types';
import type { SyncStatus } from '../services/supabaseSyncService';

interface ProfileProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onOpenDeleteAccount: () => void;
  onDataRefresh: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  onOpenTerms,
  onOpenPrivacy,
  onOpenDeleteAccount,
  onDataRefresh
}) => {
  const { isLaunchFreeMode } = useSubscription();

  const [profile, setProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [sessionEmail, setSessionEmail] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabaseSyncService.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    // Obtener datos del usuario desde Supabase Auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSessionEmail(user.email || '');
        const meta = user.user_metadata || {};
        const local = storageService.getUserProfile();
        const merged: UserProfile = {
          fullName: local.fullName || meta.full_name || meta.name || '',
          businessName: local.businessName || meta.business_name || '',
          phone: local.phone || meta.phone || '',
          email: user.email || '',
          currencySymbol: local.currencySymbol || '$'
        };
        setProfile(merged);
        storageService.saveUserProfile(merged);
      }
    });

    const unsubscribe = supabaseSyncService.subscribeStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Guardar localmente
      storageService.saveUserProfile(profile);

      // 2. Sincronizar metadata en Supabase Auth
      await supabase.auth.updateUser({
        data: {
          full_name: profile.fullName,
          business_name: profile.businessName,
          phone: profile.phone
        }
      });

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      alert('Error al actualizar el perfil en la nube.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const success = await supabaseSyncService.syncDown(() => {
      onDataRefresh();
    });
    setIsSyncing(false);
    if (success) {
      alert('¡Sincronización con la nube completada exitosamente!');
    } else {
      alert('No se pudo conectar a la nube. Revisa tu conexión a internet.');
    }
  };

  const handleExportBackup = () => {
    const backupStr = storageService.exportBackup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `credipresta_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
  };

  const handleResetLocalData = () => {
    if (window.confirm('¿Está seguro de restablecer los datos en este dispositivo? Los datos respaldados en la nube volverán a descargarse al sincronizar.')) {
      storageService.initializeData(true);
      onDataRefresh();
      alert('Datos locales restablecidos.');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('¿Deseas cerrar sesión en este dispositivo?')) {
      storageService.clearUserData();
      await supabase.auth.signOut();
    }
  };

  // Iniciales para el avatar
  const getInitials = () => {
    if (profile.fullName) {
      const parts = profile.fullName.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return profile.fullName.substring(0, 2).toUpperCase();
    }
    if (sessionEmail) {
      return sessionEmail.substring(0, 2).toUpperCase();
    }
    return 'PR';
  };

  return (
    <div className="profile-page-container animate-fade-in">
      {/* 1. Encabezado del Perfil */}
      <div className="profile-hero-card">
        <div className="profile-avatar-circle">
          <span>{getInitials()}</span>
        </div>
        <div className="profile-hero-info">
          <h2>{profile.fullName || 'Usuario de CrediPresta'}</h2>
          <p className="profile-hero-business">{profile.businessName || 'Cartera Personal'}</p>
          <span className="profile-hero-email">{sessionEmail || profile.email}</span>
        </div>
        <div className="profile-plan-pill">
          <Sparkles size={13} />
          <span>{isLaunchFreeMode ? 'Acceso Ilimitado' : 'Plan Activo'}</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="profile-success-banner animate-slide-up">
          <Check size={16} />
          <span>¡Datos de perfil actualizados correctamente!</span>
        </div>
      )}

      {/* 2. Formulario de Datos del Negocio y Perfil */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <div className="section-title-group">
            <User size={20} className="section-icon" />
            <div>
              <h3>Información de tu Perfil y Negocio</h3>
              <p className="section-subtitle">Estos datos se usan para personalizar tus comprobantes y reportes.</p>
            </div>
          </div>
          {!isEditing && (
            <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
              Editar
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="profile-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Nombre Completo</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="Tu Nombre y Apellidos"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  disabled={!isEditing || isSaving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="businessName">Nombre de tu Negocio / Cartera</label>
              <div className="input-wrapper">
                <Building2 size={16} className="input-icon" />
                <input
                  id="businessName"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Inversiones del Norte"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  disabled={!isEditing || isSaving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Teléfono / WhatsApp de Cobro</label>
              <div className="input-wrapper">
                <Phone size={16} className="input-icon" />
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  placeholder="Ej: +57 300 123 4567"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing || isSaving}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currency">Símbolo de Moneda</label>
              <div className="input-wrapper">
                <DollarSign size={16} className="input-icon" />
                <input
                  id="currency"
                  type="text"
                  className="form-input"
                  placeholder="$"
                  value={profile.currencySymbol}
                  onChange={(e) => setProfile({ ...profile, currencySymbol: e.target.value })}
                  disabled={!isEditing || isSaving}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-form-actions">
              <button 
                type="button" 
                className="profile-cancel-btn" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button type="submit" className="profile-save-btn" disabled={isSaving}>
                <Save size={16} />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 3. Gestión de Datos y Nube */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <div className="section-title-group">
            <Cloud size={20} className="section-icon" />
            <div>
              <h3>Respaldo y Sincronización en la Nube</h3>
              <p className="section-subtitle">Tus datos están protegidos y sincronizados con cifrado de extremo a extremo.</p>
            </div>
          </div>
        </div>

        <div className="profile-sync-row">
          <div className="sync-status-display">
            {syncStatus === 'synced' ? (
              <Cloud size={20} style={{ color: 'var(--success)' }} />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw size={20} className="spin" style={{ color: '#38BDF8' }} />
            ) : syncStatus === 'offline' ? (
              <CloudOff size={20} style={{ color: '#94a3b8' }} />
            ) : (
              <AlertTriangle size={20} style={{ color: '#FF385C' }} />
            )}
            <div>
              <p className="sync-title">
                {syncStatus === 'synced' ? 'Conectado y Sincronizado' :
                 syncStatus === 'syncing' ? 'Sincronizando con la nube...' :
                 syncStatus === 'offline' ? 'Modo Offline (Guardado localmente)' :
                 'Error de sincronización'}
              </p>
              <span className="sync-desc">Cuenta: {sessionEmail}</span>
            </div>
          </div>

          <button 
            className="profile-action-btn primary" 
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
          </button>
        </div>

        <div className="profile-buttons-grid">
          <button className="profile-action-btn" onClick={handleExportBackup}>
            <Download size={16} />
            <span>Exportar Respaldo (JSON)</span>
          </button>

          <label className="profile-action-btn file-label-btn">
            <Upload size={16} />
            <span>Importar Respaldo (JSON)</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              style={{ display: 'none' }} 
            />
          </label>

          <button className="profile-action-btn" onClick={handleResetLocalData}>
            <RefreshCw size={16} />
            <span>Restablecer Datos Locales</span>
          </button>
        </div>
      </div>

      {/* 4. Términos Legales, Privacidad y Versión */}
      <div className="profile-section-card">
        <div className="profile-section-header">
          <div className="section-title-group">
            <ShieldCheck size={20} className="section-icon" />
            <div>
              <h3>Legal y Cumplimiento de Políticas</h3>
              <p className="section-subtitle">Documentación oficial requerida por Google Play y normativas vigentes.</p>
            </div>
          </div>
        </div>

        <div className="profile-links-list">
          <button className="profile-link-item" onClick={onOpenTerms}>
            <FileText size={16} />
            <span>Términos y Condiciones de Uso</span>
          </button>

          <button className="profile-link-item" onClick={onOpenPrivacy}>
            <ShieldCheck size={16} />
            <span>Política de Privacidad y Tratamiento de Datos</span>
          </button>
        </div>

        <div className="profile-app-meta">
          <Info size={14} />
          <span>CrediPresta App v2.0.0 (credipresta.com)</span>
        </div>
      </div>

      {/* 5. Cierre de Sesión */}
      <div className="profile-logout-section">
        <button className="profile-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* 6. Zona de Peligro Protegida (Para eliminar cuenta de forma segura sin accidentes) */}
      <div className="danger-zone-wrapper">
        <button 
          className="danger-zone-toggle"
          onClick={() => setShowDangerZone(!showDangerZone)}
        >
          <AlertTriangle size={15} />
          <span>{showDangerZone ? 'Ocultar Opciones Avanzadas de Cuenta' : 'Opciones Avanzadas de Cuenta (Zona de Peligro)'}</span>
        </button>

        {showDangerZone && (
          <div className="danger-zone-card animate-scale-in">
            <div className="danger-zone-header">
              <AlertTriangle size={24} className="danger-zone-icon" />
              <div>
                <h4>Eliminar Cuenta y Todos los Registros</h4>
                <p>
                  Esta opción está protegida para evitar toques accidentales. Al proceder, se solicitará confirmación manual de seguridad para borrar definitivamente todos tus clientes, préstamos y movimientos de la base de datos.
                </p>
              </div>
            </div>
            <button className="danger-delete-trigger-btn" onClick={onOpenDeleteAccount}>
              Iniciar Proceso de Eliminación de Cuenta
            </button>
          </div>
        )}
      </div>

      <style>{`
        .profile-page-container {
          padding: 16px;
          padding-bottom: 95px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 650px;
          margin: 0 auto;
        }

        .profile-hero-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          box-shadow: var(--shadow-md);
        }

        .profile-avatar-circle {
          height: 60px;
          width: 60px;
          border-radius: 18px;
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          font-size: 22px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px var(--primary-glow);
          flex-shrink: 0;
        }

        .profile-hero-info {
          flex: 1;
          min-width: 0;
        }

        .profile-hero-info h2 {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-hero-business {
          font-size: 13px;
          color: var(--primary);
          font-weight: 600;
        }

        .profile-hero-email {
          font-size: 12px;
          color: var(--text-secondary);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-plan-pill {
          position: absolute;
          top: 16px;
          right: 16px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(var(--primary-rgb), 0.12);
          border: 1px solid rgba(var(--primary-rgb), 0.3);
          color: var(--primary);
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .profile-success-banner {
          background: rgba(var(--success-rgb), 0.12);
          border: 1px solid rgba(var(--success-rgb), 0.3);
          color: var(--success);
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .profile-section-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .section-title-group {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .section-icon {
          color: var(--primary);
          margin-top: 2px;
        }

        .profile-section-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .section-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .profile-edit-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 10px;
          cursor: pointer;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 500px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
        }

        .profile-cancel-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 10px;
        }

        .profile-save-btn {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          font-size: 13px;
          font-weight: 800;
          padding: 8px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px var(--primary-glow);
        }

        .profile-sync-row {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .sync-status-display {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sync-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .sync-desc {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .profile-buttons-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 500px) {
          .profile-buttons-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-action-btn {
          height: 42px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-action-btn.primary {
          background: rgba(var(--primary-rgb), 0.12);
          border-color: rgba(var(--primary-rgb), 0.3);
          color: var(--primary);
          font-weight: 700;
        }

        .file-label-btn {
          cursor: pointer;
        }

        .profile-links-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-link-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 14px;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          cursor: pointer;
        }

        .profile-app-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-tertiary);
          padding-top: 4px;
        }

        .profile-logout-section {
          display: flex;
          justify-content: center;
        }

        .profile-logout-btn {
          width: 100%;
          height: 46px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }

        .profile-logout-btn:hover {
          color: #FF385C;
          border-color: rgba(255, 56, 92, 0.3);
        }

        .danger-zone-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 10px;
        }

        .danger-zone-toggle {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px;
        }

        .danger-zone-card {
          background: rgba(255, 56, 92, 0.04);
          border: 1px solid rgba(255, 56, 92, 0.2);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .danger-zone-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .danger-zone-icon {
          color: #FF385C;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .danger-zone-header h4 {
          font-size: 14px;
          font-weight: 700;
          color: #FF385C;
        }

        .danger-zone-header p {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
          line-height: 1.4;
        }

        .danger-delete-trigger-btn {
          height: 40px;
          background: rgba(255, 56, 92, 0.12);
          border: 1px solid rgba(255, 56, 92, 0.35);
          border-radius: 12px;
          color: #FF385C;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
