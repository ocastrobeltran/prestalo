import React from 'react';
import { ArrowLeft, ShieldAlert, FileText } from 'lucide-react';

interface TermsProps {
  onBack?: () => void;
}

export const TermsAndConditions: React.FC<TermsProps> = ({ onBack }) => {
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
          <FileText size={32} className="legal-icon" />
          <h1>Términos y Condiciones de Uso</h1>
          <p className="legal-date">Sitio Oficial: credipresta.com | Última actualización: Agosto 2026</p>
        </div>

        <div className="legal-section alert-box">
          <div className="alert-header">
            <ShieldAlert size={20} className="text-warning" />
            <h3>Aclaración Legal y Exención Financiera</h3>
          </div>
          <p>
            <strong>CrediPresta</strong> (a través de <strong>credipresta.com</strong> y sus aplicaciones móviles) es una herramienta de software exclusivamente orientada a la <strong>gestión contable, cálculo matemático y administración de registros</strong> para personas naturales y microempresarios. 
          </p>
          <p>
            <strong>CrediPresta NO es una entidad bancaria, compañía de financiamiento, prestamista ni intermediario financiero.</strong> La plataforma no custodia fondos públicos, no realiza captación de dinero, ni otorga créditos directos con fondos propios.
          </p>
        </div>

        <div className="legal-section">
          <h3>1. Aceptación de los Términos</h3>
          <p>
            Al ingresar a <strong>credipresta.com</strong>, descargar, registrarte o utilizar la aplicación móvil CrediPresta, aceptas expresamente cumplir con los presentes Términos y Condiciones, así como con todas las leyes y regulaciones aplicables en tu jurisdicción.
          </p>
        </div>

        <div className="legal-section">
          <h3>2. Responsabilidad del Usuario y Tasas Legales</h3>
          <p>
            El usuario es el único responsable de la veracidad y legalidad de la información que registra en la plataforma. Asimismo, el usuario se compromete a respetar los límites máximos de tasas de interés legales vigentes en su país o territorio (evitando prácticas de usura o violaciones a la normativa financiera local). CrediPresta no asume responsabilidad alguna por los acuerdos privados pactados entre el usuario y sus clientes.
          </p>
        </div>

        <div className="legal-section">
          <h3>3. Suscripciones y Pagos (Google Play Billing / Web)</h3>
          <p>
            CrediPresta ofrece planes gratuitos y membresías premium ("CrediPresta PRO"). Los pagos de suscripciones en Android se procesan a través de la pasarela oficial de Google Play. El usuario puede cancelar o modificar su membresía en cualquier momento a través de la gestión de suscripciones de su cuenta.
          </p>
        </div>

        <div className="legal-section">
          <h3>4. Propiedad Intelectual</h3>
          <p>
            Todos los derechos de software, diseño, marca comercial, código fuente, logotipos y nombres de dominio asociados a <strong>CrediPresta</strong> y <strong>credipresta.com</strong> son propiedad exclusiva de los desarrolladores de la plataforma.
          </p>
        </div>

        <div className="legal-section">
          <h3>5. Eliminación de Cuenta y Cancelación</h3>
          <p>
            El usuario tiene el derecho inalienable de eliminar su cuenta y todos sus registros en cualquier momento desde la sección de configuración de la app o el sitio web, lo cual borrará definitivamente sus datos de nuestros servidores.
          </p>
        </div>

        <div className="legal-section">
          <h3>6. Contacto</h3>
          <p>
            Para consultas legales o soporte técnico, contáctanos a: <strong>soporte@credipresta.com</strong>.
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

        .alert-box {
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 14px;
          padding: clamp(14px, 3vw, 18px);
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FBBF24;
          margin-bottom: 8px;
        }

        .alert-header h4 {
          font-size: 14px;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
};
