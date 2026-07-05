import React from 'react';

interface BadgeProps {
  status: 'active' | 'completed' | 'overdue' | 'pending' | 'paid';
  text?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, text }) => {
  const getLabelAndColor = () => {
    switch (status) {
      case 'active':
        return { label: text || 'Activo', className: 'badge-active' };
      case 'completed':
        return { label: text || 'Pagado', className: 'badge-completed' };
      case 'overdue':
        return { label: text || 'Vencido', className: 'badge-overdue' };
      case 'pending':
        return { label: text || 'Pendiente', className: 'badge-pending' };
      case 'paid':
        return { label: text || 'Pagada', className: 'badge-completed' };
      default:
        return { label: text || '', className: '' };
    }
  };

  const { label, className } = getLabelAndColor();

  return (
    <span className={`badge ${className}`}>
      {label}
      <style>{`
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.2px;
        }

        .badge-active {
          background-color: rgba(14, 165, 233, 0.1);
          color: var(--primary);
        }

        .badge-completed {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }

        .badge-overdue {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .badge-pending {
          background-color: rgba(245, 158, 11, 0.1);
          color: var(--warning);
        }
      `}</style>
    </span>
  );
};
