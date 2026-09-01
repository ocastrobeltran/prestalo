import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Zap, MessageCircle, FileText, Cloud, Crown } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose }) => {
  const { isTrialActive, daysRemaining } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const proFeatures = [
    { icon: Zap, title: 'Préstamos y Clientes Ilimitados', desc: 'Gestiona toda tu cartera sin topes ni restricciones.' },
    { icon: MessageCircle, title: 'Recibos y Cobro por WhatsApp', desc: 'Envía estados de cuenta y comprobantes con 1 solo toque.' },
    { icon: FileText, title: 'Reportes y Auditoría en PDF/Excel', desc: 'Descarga balances contables profesionales y análisis de mora.' },
    { icon: Cloud, title: 'Respaldo en la Nube y Multi-Dispositivo', desc: 'Tus datos 100% seguros y respaldados en tiempo real.' },
    { icon: ShieldCheck, title: 'Cálculo Automatizado de Intereses', desc: 'Soporte para renovaciones de plazo y cuotas pactadas.' }
  ];

  const handleSubscribe = () => {
    setIsProcessing(true);
    // Simulación / Conector de Google Play Billing / RevenueCat
    setTimeout(() => {
      setIsProcessing(false);
      alert('Integración de Google Play Billing: Tu suscripción se activará a través de la pasarela de Google Play.');
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="paywall-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="paywall-close-btn" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        {/* Encabezado Visual de Alto Impacto */}
        <div className="paywall-header">
          <div className="crown-badge-glow">
            <Crown size={28} className="crown-icon" />
          </div>
          <h2 className="paywall-title">CrediPresta <span className="pro-gradient-text">PRO</span></h2>
          <p className="paywall-tagline">Lleva tu negocio de préstamos al siguiente nivel profesional</p>

          {isTrialActive && (
            <div className="trial-pill-badge">
              <Sparkles size={14} />
              <span>Estás disfrutando de la <strong>Prueba VIP ({daysRemaining} días restantes)</strong></span>
            </div>
          )}
        </div>

        {/* Lista de Beneficios Exclusivos */}
        <div className="pro-features-list">
          {proFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="pro-feature-item">
                <div className="feature-icon-pill">
                  <Icon size={18} />
                </div>
                <div className="feature-text">
                  <h4>{feat.title}</h4>
                  <p>{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selector de Planes de Suscripción */}
        <div className="pricing-plans-grid">
          <div 
            className={`plan-card ${selectedPlan === 'yearly' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <div className="best-value-badge">Ahorra 45%</div>
            <div className="plan-name">Plan Anual VIP</div>
            <div className="plan-price">$2.99 <span className="period">/ mes</span></div>
            <div className="plan-billing-note">Facturado anualmente ($35.99/año)</div>
          </div>

          <div 
            className={`plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="plan-name">Plan Mensual</div>
            <div className="plan-price">$5.49 <span className="period">/ mes</span></div>
            <div className="plan-billing-note">Cancela en cualquier momento</div>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="paywall-action-container">
          <button 
            className="aurora-subscribe-btn"
            onClick={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? 'Conectando con Google Play...' : 'Comenzar con CrediPresta PRO'}
          </button>
          
          <p className="legal-disclaimer-text">
            Pago procesado de forma segura a través de <strong>Google Play</strong>. Puedes cancelar tu suscripción en cualquier momento desde los ajustes de tu cuenta de Google Play.
          </p>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 6, 12, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .paywall-card {
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          background: var(--bg-card);
          border: 1px solid rgba(0, 242, 157, 0.3);
          border-radius: 26px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 157, 0.15);
          padding: 28px 24px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .paywall-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          height: 34px;
          width: 34px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .paywall-close-btn:hover {
          color: var(--text-primary);
          border-color: var(--primary);
        }

        .paywall-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .crown-badge-glow {
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: linear-gradient(135deg, #111828, #1A243C);
          border: 1px solid rgba(251, 191, 36, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px rgba(251, 191, 36, 0.25);
          color: #FBBF24;
        }

        .paywall-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }

        .pro-gradient-text {
          background: linear-gradient(135deg, #00F29D, #38BDF8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .paywall-tagline {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 320px;
        }

        .trial-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 242, 157, 0.12);
          border: 1px solid rgba(0, 242, 157, 0.3);
          color: #00F29D;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 20px;
          margin-top: 4px;
        }

        .pro-features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 16px;
        }

        .pro-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .feature-icon-pill {
          height: 34px;
          width: 34px;
          flex-shrink: 0;
          border-radius: 10px;
          background: rgba(0, 242, 157, 0.12);
          border: 1px solid rgba(0, 242, 157, 0.25);
          color: #00F29D;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-text h4 {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .feature-text p {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.3;
        }

        .pricing-plans-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .plan-card {
          background: var(--bg-elevated);
          border: 2px solid var(--border-color);
          border-radius: 16px;
          padding: 16px 12px;
          cursor: pointer;
          position: relative;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .plan-card.selected {
          border-color: #00F29D;
          background: rgba(0, 242, 157, 0.05);
          box-shadow: 0 0 18px rgba(0, 242, 157, 0.2);
        }

        .best-value-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #00F29D, #00D68A);
          color: #070A12;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        .plan-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .plan-price {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .plan-price .period {
          font-size: 12px;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .plan-billing-note {
          font-size: 10px;
          color: var(--text-tertiary);
          margin-top: 4px;
        }

        .paywall-action-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .aurora-subscribe-btn {
          height: 52px;
          background: linear-gradient(135deg, #00F29D 0%, #00D68A 100%);
          color: #070A12;
          font-size: 15px;
          font-weight: 800;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0, 242, 157, 0.35);
          transition: transform 0.1s ease;
          border: none;
        }

        .aurora-subscribe-btn:active {
          transform: scale(0.97);
        }

        .legal-disclaimer-text {
          font-size: 10px;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};
