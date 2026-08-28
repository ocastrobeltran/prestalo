import React from 'react';
import { Home, Users, DollarSign, Calendar, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'prestamos', label: 'Préstamos', icon: DollarSign },
    { id: 'calendario', label: 'Cobros', icon: Calendar },
    { id: 'reportes', label: 'Métricas', icon: BarChart3 }
  ];

  return (
    <nav className="floating-bottom-nav no-print" aria-label="Navegación principal">
      <div className="nav-capsule">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="icon-wrapper">
                <IconComponent size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && <div className="active-glow-dot" />}
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .floating-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom));
          pointer-events: none;
          z-index: 100;
        }

        .nav-capsule {
          pointer-events: auto;
          width: 100%;
          max-width: 440px;
          height: 64px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 32px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 8px;
          box-shadow: var(--shadow-lg), 0 0 20px rgba(0, 0, 0, 0.25);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: 100%;
          color: var(--text-tertiary);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 4px 0;
        }

        .icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          width: 32px;
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-item.active {
          color: var(--primary);
        }

        .nav-item.active .icon-wrapper {
          background: rgba(var(--primary-rgb), 0.12);
          transform: translateY(-2px);
          color: var(--primary);
        }

        .active-glow-dot {
          position: absolute;
          bottom: -2px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 8px var(--primary);
        }

        .nav-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: -0.1px;
          margin-top: 2px;
          transition: color 0.2s;
        }

        .nav-item.active .nav-label {
          color: var(--text-primary);
          font-weight: 700;
        }

        .nav-item:active {
          transform: scale(0.92);
        }
      `}</style>
    </nav>
  );
};
