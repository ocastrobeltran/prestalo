import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface PrivacyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyProps> = ({ onBack }) => {
  return (
    <div className="legal-page-container animate-fade-in">
      {onBack && (
        <button className="legal-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Volver a la App</span>
        </button>
      )}

      <div className="legal-card">
        <div className="legal-header">
          <ShieldCheck size={32} className="legal-icon" />
          <h1>Política de Privacidad</h1>
          <p className="legal-date">Sitio Oficial: credipresta.com | Última actualización: Agosto 2026</p>
        </div>

        <div className="legal-section">
          <h3>1. Compromiso con tu Privacidad</h3>
          <p>
            En <strong>CrediPresta</strong> (disponible a través de <strong>credipresta.com</strong> y sus aplicaciones móviles) nos tomamos muy en serio la seguridad y privacidad de tu información financiera. Esta Política describe cómo recopilamos, utilizamos, almacenamos y protegemos tus datos personales conforme a los estándares internacionales (GDPR, CCPA) y las directrices de privacidad de <strong>Google Play</strong> y <strong>Apple App Store</strong>.
          </p>
        </div>

        <div className="legal-section">
          <h3>2. Datos que Recopilamos</h3>
          <p>
            • <strong>Datos de Cuenta:</strong> Correo electrónico y credenciales de acceso para autenticación segura en Supabase Auth.
          </p>
          <p>
            • <strong>Datos de Cartera y Clientes:</strong> Nombres, números de teléfono, direcciones y registros de créditos introducidos manualmente por el usuario. Estos datos se almacenan cifrados y son de acceso exclusivo para tu cuenta (Row Level Security).
          </p>
        </div>

        <div className="legal-section">
          <h3>3. Uso Exclusivo de la Información</h3>
          <p>
            Tus datos se utilizan <strong>únicamente para proveer las funcionalidades de la aplicación</strong> (cálculo de amortizaciones, generación de recibos, recordatorios y sincronización en la nube). 
          </p>
          <p>
            <strong>Nunca vendemos, alquilamos ni compartimos tu información personal ni la de tus clientes con terceros para fines publicitarios.</strong>
          </p>
        </div>

        <div className="legal-section">
          <h3>4. Seguridad y Cifrado</h3>
          <p>
            Toda la comunicación entre tu dispositivo móvil/navegador web y la nube se realiza a través de conexiones seguras y cifradas mediante protocolo <strong>HTTPS / TLS 1.3</strong>. Los datos en reposo están protegidos con políticas de aislamiento a nivel de fila (RLS) en bases de datos PostgreSQL de alto rendimiento.
          </p>
        </div>

        <div className="legal-section">
          <h3>5. Derechos del Usuario y Eliminación de Datos</h3>
          <p>
            Tienes derecho a acceder, rectificar, exportar o eliminar definitivamente todos tus datos en cualquier momento. La opción de <strong>"Eliminar Cuenta y Datos"</strong> dentro de la app borra en cascada e inmediatamente todos tus registros de nuestros servidores sin posibilidad de recuperación.
          </p>
        </div>

        <div className="legal-section">
          <h3>6. Contacto y Soporte</h3>
          <p>
            Para consultas relacionadas con esta política de privacidad o el ejercicio de tus derechos de protección de datos, puedes comunicarte con nuestro equipo oficial a través de: <strong>soporte@credipresta.com</strong> o visitando <strong>https://credipresta.com</strong>.
          </p>
        </div>
      </div>

      <style>{`
        .legal-page-container {
          padding: clamp(16px, 3vw, 24px) 16px;
          padding-bottom: 90px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 780px;
          margin: 0 auto;
          width: 100%;
        }

        .legal-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-size: 14px;
          font-weight: 700;
          padding: 8px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          align-self: flex-start;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .legal-back-btn:hover {
          background-color: var(--bg-elevated);
        }

        .legal-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--shadow-md);
        }

        .legal-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .legal-icon {
          color: var(--primary);
          margin-bottom: 4px;
        }

        .legal-header h1 {
          font-size: clamp(20px, 3.5vw, 26px);
          font-weight: 800;
        }

        .legal-date {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .legal-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legal-section h3 {
          font-size: clamp(14px, 2vw, 16px);
          font-weight: 700;
          color: var(--text-primary);
        }

        .legal-section p {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};
