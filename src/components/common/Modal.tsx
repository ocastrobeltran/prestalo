import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-content animate-slide-up" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end; /* En móviles desliza desde abajo como un Bottom Sheet */
          justify-content: center;
          z-index: 200;
        }

        .modal-content {
          width: 100%;
          background-color: var(--bg-card);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          max-height: 85%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.15);
          border-top: 1px solid var(--border-color);
        }

        @media (min-width: 480px) {
          .modal-backdrop {
            align-items: center; /* En escritorio centrado */
            padding: 16px;
          }
          
          .modal-content {
            border-radius: 16px;
            max-width: 440px;
            max-height: 80%;
            border: 1px solid var(--border-color);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
        }

        .modal-close-btn {
          height: 32px;
          width: 32px;
          border-radius: 50%;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .modal-close-btn:hover {
          background-color: var(--border-color);
          color: var(--text-primary);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          padding-bottom: 32px;
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  );
};
