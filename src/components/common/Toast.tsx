import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastData {
  id?: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'danger';
  duration?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'info';

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="toast-icon success" />;
      case 'warning':
        return <AlertTriangle size={20} className="toast-icon warning" />;
      case 'danger':
        return <AlertCircle size={20} className="toast-icon danger" />;
      default:
        return <Info size={20} className="toast-icon info" />;
    }
  };

  return (
    <div className="toast-container animate-slide-down" role="status" aria-live="polite">
      <div className={`toast-card ${type} shadow-lg`}>
        <div className="toast-icon-wrapper">
          {getIcon()}
        </div>

        <div className="toast-content">
          <h4 className="toast-title">{toast.title}</h4>
          <p className="toast-message">{toast.message}</p>
        </div>

        <button 
          className="toast-close-btn" 
          onClick={onClose} 
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>

        <div className="toast-progress-bar" style={{ animationDuration: `${toast.duration || 4500}ms` }} />
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          top: calc(68px + env(safe-area-inset-top));
          left: 50%;
          transform: translateX(-50%);
          z-index: 250;
          width: calc(100% - 32px);
          max-width: 440px;
          pointer-events: none;
        }

        .toast-card {
          position: relative;
          pointer-events: auto;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
          overflow: hidden;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .toast-card.success {
          border-left: 4px solid var(--success, #10b981);
        }

        .toast-card.danger {
          border-left: 4px solid var(--danger, #ef4444);
        }

        .toast-card.warning {
          border-left: 4px solid var(--warning, #f59e0b);
        }

        .toast-card.info {
          border-left: 4px solid var(--primary, #0ea5e9);
        }

        .toast-icon-wrapper {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .toast-icon.success {
          color: var(--success, #10b981);
        }

        .toast-icon.danger {
          color: var(--danger, #ef4444);
        }

        .toast-icon.warning {
          color: var(--warning, #f59e0b);
        }

        .toast-icon.info {
          color: var(--primary, #0ea5e9);
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
          letter-spacing: -0.2px;
        }

        .toast-message {
          font-size: 13px;
          line-height: 1.4;
          color: var(--text-secondary);
        }

        .toast-close-btn {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, color 0.15s;
        }

        .toast-close-btn:hover {
          background-color: var(--bg-elevated);
          color: var(--text-primary);
        }

        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          background: currentColor;
          opacity: 0.3;
          animation: toast-progress linear forwards;
        }

        .toast-card.success .toast-progress-bar {
          background-color: var(--success, #10b981);
        }

        .toast-card.danger .toast-progress-bar {
          background-color: var(--danger, #ef4444);
        }

        .toast-card.warning .toast-progress-bar {
          background-color: var(--warning, #f59e0b);
        }

        .toast-card.info .toast-progress-bar {
          background-color: var(--primary, #0ea5e9);
        }

        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
