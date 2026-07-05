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
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 }
  ];

  return (
    <nav className="bottom-nav no-print">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
          >
            <div className="icon-wrapper">
              <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}

      <style>{`
        .bottom-nav {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 68px;
          background-color: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 100;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
          transition: background-color 0.3s, border-color 0.3s;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: 100%;
          color: var(--text-tertiary);
          font-size: 10px;
          font-weight: 500;
          gap: 4px;
          transition: color 0.2s ease, transform 0.1s ease;
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          width: 28px;
          border-radius: 8px;
          transition: background-color 0.2s, transform 0.2s;
        }

        .nav-item.active {
          color: var(--primary);
        }

        .nav-item.active .icon-wrapper {
          transform: translateY(-2px);
        }

        .nav-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1px;
        }
      `}</style>
    </nav>
  );
};
