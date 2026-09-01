import React, { useState } from 'react';
import { 
  Cloud, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  Mail,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface LandingProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Landing: React.FC<LandingProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenTerms,
  onOpenPrivacy
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Calendar,
      title: 'Cobranza Diaria y Rutas',
      desc: 'Organiza pagos diarios, semanales, quincenales y mensuales con calendario inteligente de vencimientos.'
    },
    {
      icon: MessageSquare,
      title: 'Comprobantes por WhatsApp',
      desc: 'Genera y envía recibos de pago y extractos de cuenta detallados a tus clientes con un solo toque.'
    },
    {
      icon: Zap,
      title: 'Abonos y Cuotas Pactadas',
      desc: 'Maneja pagos parciales libres, excedentes automáticos y renovación de plazos por cobro de interés.'
    },
    {
      icon: TrendingUp,
      title: 'Control de Caja y Métricas',
      desc: 'Conoce en tiempo real tu capital prestado, intereses recuperados, cartera vigente y liquidez neta.'
    },
    {
      icon: Cloud,
      title: '100% Offline-First y Nube',
      desc: 'Opera en zonas sin señal sin interrupciones. Tus datos se sincronizan automáticamente al recuperar internet.'
    },
    {
      icon: Lock,
      title: 'Seguridad y Privacidad RLS',
      desc: 'Aislamiento multi-inquilino estricto en bases de datos PostgreSQL. Nadie más tiene acceso a tu información.'
    }
  ];

  const faqs = [
    {
      q: '¿Qué es CrediPresta?',
      a: 'CrediPresta es una plataforma y software de gestión contable diseñada para prestamistas independientes, microempresarios y administradores de carteras que necesitan llevar un control riguroso de cobros, capital y clientes.'
    },
    {
      q: '¿Funciona sin conexión a internet?',
      a: 'Sí. CrediPresta está construida bajo una arquitectura Offline-First. Puedes registrar abonos, nuevos clientes y préstamos en la calle sin señal, y la app sincronizará todo con la nube de forma transparente cuando tengas conexión.'
    },
    {
      q: '¿Cómo se protegen los datos de mi cartera?',
      a: 'Utilizamos cifrado TLS 1.3 de grado bancario y políticas de seguridad a nivel de fila (Row Level Security en PostgreSQL). Tus registros están completamente aislados y son propiedad exclusiva de tu cuenta.'
    },
    {
      q: '¿CrediPresta presta dinero directamente?',
      a: 'No. CrediPresta es exclusivamente un software de gestión y cálculo contable. No realizamos captación, custodia de dinero ni intermediación financiera.'
    }
  ];

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container animate-fade-in">
      {/* 1. Header de Navegación Web Responsive */}
      <header className="landing-navbar">
        <div className="landing-nav-content">
          <div className="landing-brand">
            <img src="/logo.png" alt="CrediPresta Logo" className="landing-brand-logo" />
            <span className="landing-brand-name">CrediPresta</span>
          </div>

          {/* Navegación Desktop */}
          <nav className="landing-nav-links" aria-label="Navegación principal">
            <button className="nav-link-btn" onClick={() => handleNavClick('caracteristicas')}>Características</button>
            <button className="nav-link-btn" onClick={() => handleNavClick('beneficios')}>Beneficios</button>
            <button className="nav-link-btn" onClick={() => handleNavClick('faq')}>Preguntas Frecuentes</button>
          </nav>

          {/* Acciones Desktop */}
          <div className="landing-nav-actions">
            <button className="landing-btn-secondary" onClick={onOpenLogin}>
              Iniciar Sesión
            </button>
            <button className="landing-btn-primary" onClick={onOpenRegister}>
              <span>Crear Cuenta Gratis</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Botón Menú Hamburguesa para Móvil */}
          <div className="landing-mobile-toggle-group">
            <button className="mobile-quick-login-btn" onClick={onOpenLogin}>
              Entrar
            </button>
            <button 
              className="landing-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Drawer Menú Móvil */}
        {mobileMenuOpen && (
          <div className="landing-mobile-drawer animate-slide-up">
            <nav className="mobile-nav-list">
              <button className="mobile-nav-item" onClick={() => handleNavClick('caracteristicas')}>
                <span>Características</span>
                <ChevronRight size={16} />
              </button>
              <button className="mobile-nav-item" onClick={() => handleNavClick('beneficios')}>
                <span>Beneficios y WhatsApp</span>
                <ChevronRight size={16} />
              </button>
              <button className="mobile-nav-item" onClick={() => handleNavClick('faq')}>
                <span>Preguntas Frecuentes</span>
                <ChevronRight size={16} />
              </button>
              <button className="mobile-nav-item" onClick={() => { setMobileMenuOpen(false); onOpenPrivacy(); }}>
                <span>Política de Privacidad</span>
                <ChevronRight size={16} />
              </button>
              <button className="mobile-nav-item" onClick={() => { setMobileMenuOpen(false); onOpenTerms(); }}>
                <span>Términos y Condiciones</span>
                <ChevronRight size={16} />
              </button>
            </nav>

            <div className="mobile-drawer-actions">
              <button className="landing-btn-primary mobile-full-btn" onClick={() => { setMobileMenuOpen(false); onOpenRegister(); }}>
                <span>Crear Cuenta Gratis</span>
                <ArrowRight size={16} />
              </button>
              <button className="landing-btn-secondary mobile-full-btn" onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}>
                <span>Iniciar Sesión en mi Cartera</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">
          <Sparkles size={14} className="hero-sparkle-icon" />
          <span>Gestión Inteligente de Créditos y Cobranza | credipresta.com</span>
        </div>

        <h1 className="hero-title">
          El Control Total de tus Préstamos en tu Bolsillo y en la Web
        </h1>

        <p className="hero-subtitle">
          Diseñado para prestamistas y carteras de crédito. Controla cobros diarios, automatiza amortizaciones, envía comprobantes por WhatsApp y opera <strong>100% offline</strong> con respaldo seguro en la nube.
        </p>

        <div className="hero-cta-group">
          <button className="hero-btn-primary" onClick={onOpenRegister}>
            <span>Comenzar Ahora Gratis</span>
            <ArrowRight size={18} />
          </button>
          <button className="hero-btn-secondary" onClick={onOpenLogin}>
            <span>Acceder a mi Cuenta Web</span>
          </button>
        </div>

        {/* Badges de Confianza */}
        <div className="hero-trust-row">
          <div className="trust-item">
            <CheckCircle2 size={16} className="trust-icon" />
            <span>Sincronización en la Nube</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={16} className="trust-icon" />
            <span>Modo 100% Offline</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={16} className="trust-icon" />
            <span>Cifrado y Privacidad RLS</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={16} className="trust-icon" />
            <span>Disponible en Android & Web</span>
          </div>
        </div>
      </section>

      {/* 3. Grid de Características Principales */}
      <section id="caracteristicas" className="landing-section">
        <div className="section-heading">
          <span className="section-tag">Funcionalidades Clave</span>
          <h2>Todo lo que necesitas para administrar tu cartera de crédito</h2>
          <p>Herramientas diseñadas para agilizar tu flujo de cobranza diaria y eliminar errores contables.</p>
        </div>

        <div className="features-grid">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="feature-card">
                <div className="feature-icon-wrapper">
                  <Icon size={24} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Sección de Impacto: WhatsApp y Recibos */}
      <section id="beneficios" className="landing-banner-section">
        <div className="banner-content">
          <div className="banner-text">
            <span className="banner-tag">Transparencia y Cobranza Ágil</span>
            <h2>Recibos profesionales por WhatsApp al instante</h2>
            <p>
              Olvídate de las tarjetas de cartón y planillas en papel. Con CrediPresta generas y compartes extractos de cuotas, saldos pendientes y comprobantes de abono directamente al WhatsApp de tus clientes.
            </p>
            <ul className="banner-list">
              <li>
                <CheckCircle2 size={18} className="list-check" />
                <span>Desglose automático de abonos a capital e interés.</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="list-check" />
                <span>Historial de cuotas pactadas y renovaciones de plazo.</span>
              </li>
              <li>
                <CheckCircle2 size={18} className="list-check" />
                <span>Comprobantes listos para imprimir o compartir digitalmente.</span>
              </li>
            </ul>
          </div>
          <div className="banner-visual">
            <div className="mock-receipt-card">
              <div className="receipt-header">
                <span className="receipt-title">*CREDIPRESTA*</span>
                <span className="receipt-status">Comprobante Oficial</span>
              </div>
              <div className="receipt-divider">--------------------------------</div>
              <div className="receipt-row"><span>Cliente:</span><strong>Carlos Mendoza</strong></div>
              <div className="receipt-row"><span>Monto Préstamo:</span><strong>,000,000</strong></div>
              <div className="receipt-row"><span>Tasa Interés:</span><strong>20% (Mes)</strong></div>
              <div className="receipt-row"><span>Modalidad:</span><strong>Diario (30 Cuotas)</strong></div>
              <div className="receipt-divider">--------------------------------</div>
              <div className="receipt-highlight">
                <span>Último Abono:</span>
                <strong className="text-success">,000 (PAGADO ✓)</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Preguntas Frecuentes (FAQ) */}
      <section id="faq" className="landing-section">
        <div className="section-heading">
          <span className="section-tag">Dudas Comunes</span>
          <h2>Preguntas Frecuentes</h2>
          <p>Encuentra respuestas rápidas sobre el uso y seguridad de CrediPresta.</p>
        </div>

        <div className="faq-grid">
          {faqs.map((faq, idx) => (
            <div key={idx} className="faq-card">
              <div className="faq-q">
                <HelpCircle size={20} className="faq-icon" />
                <h4>{faq.q}</h4>
              </div>
              <p className="faq-a">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Final de Registro */}
      <section className="landing-final-cta">
        <div className="final-cta-card">
          <h2>Comienza a gestionar tu cartera de manera profesional hoy</h2>
          <p>Crea tu cuenta gratuita en menos de 1 minuto y toma el control de tus préstamos.</p>
          <div className="final-cta-buttons">
            <button className="hero-btn-primary" onClick={onOpenRegister}>
              <span>Registrarse Gratis en CrediPresta</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer Oficial con Enlaces Legales y Contacto */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-col-brand">
            <div className="landing-brand">
              <img src="/logo.png" alt="CrediPresta Logo" className="landing-brand-logo" />
              <span className="landing-brand-name">CrediPresta</span>
            </div>
            <p className="footer-desc">
              Software especializado en gestión contable, cálculo de amortización y administración de cartera para prestamistas.
            </p>
            <span className="footer-domain">Dominio oficial: <strong>credipresta.com</strong></span>
          </div>

          <div className="footer-col">
            <h4>Plataforma</h4>
            <button className="footer-link-btn" onClick={onOpenLogin}>Iniciar Sesión</button>
            <button className="footer-link-btn" onClick={onOpenRegister}>Crear Cuenta</button>
            <a href="#caracteristicas" className="footer-link">Características</a>
            <a href="#faq" className="footer-link">Preguntas Frecuentes</a>
          </div>

          <div className="footer-col">
            <h4>Legal y Tiendas</h4>
            <button className="footer-link-btn" onClick={onOpenPrivacy}>Política de Privacidad</button>
            <button className="footer-link-btn" onClick={onOpenTerms}>Términos y Condiciones</button>
            <a href="#faq" className="footer-link">Aclaración Financiera</a>
          </div>

          <div className="footer-col">
            <h4>Soporte y Contacto</h4>
            <a href="mailto:soporte@credipresta.com" className="footer-contact-link">
              <Mail size={16} />
              <span>soporte@credipresta.com</span>
            </a>
            <p className="footer-support-note">
              Atención y asistencia técnica para usuarios de la plataforma móvil y web.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 CrediPresta (credipresta.com). Todos los derechos reservados.</p>
        </div>
      </footer>

      <style>{`
        .landing-container {
          min-height: 100vh;
          background-color: var(--bg-app);
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }

        .landing-navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background-color: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color);
          padding: 10px 16px;
        }

        .landing-nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landing-brand-logo {
          height: 34px;
          width: 34px;
          object-fit: contain;
          border-radius: 10px;
          background: linear-gradient(135deg, #111828, #1A243C);
          border: 1px solid rgba(0, 242, 157, 0.3);
        }

        .landing-brand-name {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #00F29D 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-link-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.2s, background-color 0.2s;
        }

        .nav-link-btn:hover {
          color: var(--primary);
          background-color: var(--bg-elevated);
        }

        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landing-mobile-toggle-group {
          display: none;
          align-items: center;
          gap: 8px;
        }

        .mobile-quick-login-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 10px;
          cursor: pointer;
        }

        .landing-menu-toggle {
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          height: 38px;
          width: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .landing-nav-links, .landing-nav-actions {
            display: none;
          }
          .landing-mobile-toggle-group {
            display: flex;
          }
        }

        .landing-mobile-drawer {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mobile-nav-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-nav-item {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s;
        }

        .mobile-nav-item:active {
          background-color: var(--bg-elevated);
          color: var(--primary);
        }

        .mobile-drawer-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-color);
        }

        .mobile-full-btn {
          width: 100%;
          justify-content: center;
          height: 46px;
        }

        .landing-btn-secondary {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .landing-btn-secondary:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .landing-btn-primary {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: none;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 4px 14px var(--primary-glow);
          transition: transform 0.15s;
        }

        .landing-btn-primary:active {
          transform: scale(0.97);
        }

        .landing-hero {
          max-width: 900px;
          margin: 0 auto;
          padding: clamp(36px, 8vw, 72px) 20px 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 242, 157, 0.1);
          border: 1px solid rgba(0, 242, 157, 0.3);
          color: #00F29D;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 20px;
        }

        .hero-sparkle-icon {
          color: #00F29D;
        }

        .hero-title {
          font-size: clamp(28px, 6vw, 46px);
          font-weight: 900;
          line-height: 1.18;
          letter-spacing: -0.8px;
          background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 60%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(14px, 2.5vw, 17px);
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 680px;
        }

        .hero-cta-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
          max-width: 520px;
          margin-top: 6px;
        }

        @media (max-width: 520px) {
          .hero-cta-group {
            flex-direction: column;
          }
          .hero-btn-primary, .hero-btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }

        .hero-btn-primary {
          background: var(--btn-primary-bg);
          color: var(--btn-primary-text);
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 6px 20px var(--primary-glow);
          transition: transform 0.15s;
          min-height: 48px;
        }

        .hero-btn-primary:active {
          transform: scale(0.97);
        }

        .hero-btn-secondary {
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          color: var(--text-primary);
          padding: 14px 24px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          min-height: 48px;
        }

        .hero-btn-secondary:hover {
          border-color: var(--primary);
        }

        .hero-trust-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px 24px;
          margin-top: 16px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
          width: 100%;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .trust-icon {
          color: var(--primary);
        }

        .landing-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: clamp(40px, 6vw, 64px) 16px;
          width: 100%;
        }

        .section-heading {
          text-align: center;
          max-width: 600px;
          margin: 0 auto clamp(24px, 4vw, 40px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .section-tag {
          font-size: 12px;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .section-heading h2 {
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 800;
          color: var(--text-primary);
        }

        .section-heading p {
          font-size: clamp(13px, 2vw, 15px);
          color: var(--text-secondary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          gap: 18px;
        }

        .feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: clamp(18px, 3vw, 24px);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s, border-color 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 242, 157, 0.4);
        }

        .feature-icon-wrapper {
          height: 46px;
          width: 46px;
          border-radius: 14px;
          background: rgba(0, 242, 157, 0.12);
          border: 1px solid rgba(0, 242, 157, 0.3);
          color: #00F29D;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-card h3 {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .feature-card p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .landing-banner-section {
          background: var(--bg-elevated);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: clamp(40px, 6vw, 64px) 16px;
        }

        .banner-content {
          max-width: 1050px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: clamp(24px, 4vw, 40px);
          align-items: center;
        }

        @media (max-width: 820px) {
          .banner-content {
            grid-template-columns: 1fr;
          }
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .banner-tag {
          font-size: 12px;
          font-weight: 800;
          color: var(--primary);
          text-transform: uppercase;
        }

        .banner-text h2 {
          font-size: clamp(22px, 4vw, 30px);
          font-weight: 800;
          line-height: 1.2;
        }

        .banner-text p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .banner-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }

        .banner-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-primary);
        }

        .list-check {
          color: var(--primary);
          flex-shrink: 0;
        }

        .mock-receipt-card {
          background: var(--bg-card);
          border: 1px solid rgba(0, 242, 157, 0.3);
          border-radius: 18px;
          padding: clamp(16px, 3vw, 22px);
          font-family: monospace;
          font-size: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 100%;
          overflow-x: auto;
        }

        .receipt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .receipt-title {
          font-weight: 800;
          color: var(--primary);
        }

        .receipt-status {
          font-size: 11px;
          background: rgba(0, 242, 157, 0.15);
          color: #00F29D;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .receipt-divider {
          color: var(--text-tertiary);
          overflow: hidden;
        }

        .receipt-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          gap: 10px;
        }

        .receipt-highlight {
          display: flex;
          justify-content: space-between;
          background: rgba(0, 242, 157, 0.08);
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          gap: 10px;
        }

        .text-success {
          color: #00F29D;
        }

        .faq-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 16px;
        }

        .faq-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: clamp(16px, 3vw, 20px);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .faq-q {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .faq-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .faq-q h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .faq-a {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          padding-left: 30px;
        }

        .landing-final-cta {
          max-width: 900px;
          margin: 20px auto clamp(40px, 6vw, 70px);
          padding: 0 16px;
          width: 100%;
        }

        .final-cta-card {
          background: linear-gradient(135deg, rgba(0, 242, 157, 0.12), rgba(56, 189, 248, 0.08));
          border: 1.5px solid rgba(0, 242, 157, 0.3);
          border-radius: 24px;
          padding: clamp(28px, 6vw, 44px) clamp(16px, 4vw, 32px);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .final-cta-card h2 {
          font-size: clamp(20px, 4vw, 28px);
          font-weight: 800;
        }

        .final-cta-card p {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 500px;
        }

        .final-cta-buttons {
          margin-top: 6px;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        @media (max-width: 520px) {
          .final-cta-buttons .hero-btn-primary {
            width: 100%;
            justify-content: center;
          }
        }

        .landing-footer {
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
          padding: clamp(32px, 5vw, 48px) 16px 24px;
          margin-top: auto;
        }

        .footer-content {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: clamp(24px, 4vw, 36px);
        }

        @media (max-width: 860px) {
          .footer-content {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .footer-content {
            grid-template-columns: 1fr;
          }
        }

        .footer-col-brand {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .footer-domain {
          font-size: 12px;
          color: var(--primary);
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-col h4 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .footer-link, .footer-link-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          text-align: left;
          padding: 4px 0;
          cursor: pointer;
          transition: color 0.2s;
        }

        .footer-link:hover, .footer-link-btn:hover {
          color: var(--primary);
        }

        .footer-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--primary);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .footer-support-note {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }

        .footer-bottom {
          max-width: 1100px;
          margin: 30px auto 0;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
          text-align: center;
          font-size: 12px;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};
