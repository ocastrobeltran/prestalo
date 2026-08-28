import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { storageService } from '../../services/storageService';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== 'ELIMINAR') {
      setError('Por favor escribe la palabra "ELIMINAR" en mayúsculas.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // 1. Llamar a la función RPC de Supabase para borrar todos los datos del usuario
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      if (rpcError) {
        console.warn('RPC delete_user_account no disponible o falló:', rpcError.message);
        // Fallback: Borrar registros directos
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase.from('installments').delete().eq('user_id', session.user.id);
          await supabase.from('loans').delete().eq('user_id', session.user.id);
          await supabase.from('clients').delete().eq('user_id', session.user.id);
          await supabase.from('transactions').delete().eq('user_id', session.user.id);
          await supabase.from('capital_box').delete().eq('user_id', session.user.id);
          await supabase.from('user_subscriptions').delete().eq('user_id', session.user.id);
        }
      }

      // 2. Limpiar almacenamiento local y cerrar sesión
      storageService.clearUserData();
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      console.error('Error al eliminar cuenta:', err);
      setError(err.message || 'Error al eliminar la cuenta.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="delete-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="delete-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="delete-header">
          <div className="delete-icon-box">
            <AlertTriangle size={28} className="danger-icon" />
          </div>
          <h3>Eliminar Cuenta y Todos los Datos</h3>
          <p className="delete-subtitle">
            Esta acción es <strong>permanente e irreversible</strong>. Se borrarán todos tus clientes, préstamos, historial de pagos, caja de capital y tu suscripción de nuestros servidores.
          </p>
        </div>

        {error && (
          <div className="delete-error-banner">
            <span>{error}</span>
          </div>
        )}

        <div className="delete-form-group">
          <label htmlFor="confirm-delete-input">
            Escribe <strong>ELIMINAR</strong> para confirmar el borrado:
          </label>
          <input
            id="confirm-delete-input"
            type="text"
            className="delete-input"
            placeholder="ELIMINAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
          />
        </div>

        <div className="delete-actions">
          <button className="delete-cancel-btn" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </button>
          <button 
            className="delete-confirm-btn" 
            onClick={handleDelete}
            disabled={confirmText !== 'ELIMINAR' || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Eliminar Definitivamente</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .delete-modal-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-card);
          border: 1px solid rgba(255, 56, 92, 0.3);
          border-radius: 22px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
          padding: 26px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
        }

        .delete-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          color: var(--text-tertiary);
        }

        .delete-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .delete-icon-box {
          height: 56px;
          width: 56px;
          border-radius: 18px;
          background: rgba(255, 56, 92, 0.12);
          border: 1px solid rgba(255, 56, 92, 0.3);
          color: #FF385C;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-header h3 {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .delete-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .delete-error-banner {
          background: rgba(255, 56, 92, 0.1);
          border: 1px solid rgba(255, 56, 92, 0.25);
          color: #FF385C;
          padding: 10px;
          border-radius: 10px;
          font-size: 12px;
        }

        .delete-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .delete-form-group label {
          font-size: 12px;
          color: var(--text-primary);
        }

        .delete-input {
          height: 44px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: var(--bg-input);
          padding: 0 14px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }

        .delete-input:focus {
          border-color: #FF385C;
        }

        .delete-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .delete-cancel-btn {
          flex: 1;
          height: 44px;
          border-radius: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 13px;
        }

        .delete-confirm-btn {
          flex: 1.3;
          height: 44px;
          border-radius: 12px;
          background: #FF385C;
          color: white;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .delete-confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
