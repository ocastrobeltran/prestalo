import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Traducir algunos errores comunes
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('El correo electrónico no ha sido verificado.');
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      console.error('Error de login:', err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Elementos decorativos de fondo (Orbes brillantes) */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo-container">
            <Lock className="login-logo-icon" size={28} />
          </div>
          <h1 className="login-title">Préstalo</h1>
          <p className="login-subtitle">Gestión de Cobros y Préstamos</p>
        </div>

        {errorMsg && (
          <div className="error-banner">
            <AlertCircle size={18} className="error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="ejemplo@prestalo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Iniciando Sesión...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Pregunta al administrador por tu usuario y contraseña.</p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-app);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Orbes de fondo */
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        .orb-1 {
          width: 300px;
          height: 300px;
          background: var(--primary);
          top: 10%;
          left: -5%;
        }
        .orb-2 {
          width: 350px;
          height: 350px;
          background: #3b82f6;
          bottom: 10%;
          right: -5%;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          box-shadow: var(--shadow-xl);
          padding: 32px;
          z-index: 10;
        }

        /* Adaptación en modo claro */
        html:not(.dark) .login-card {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        }
        html:not(.dark) .bg-orb {
          opacity: 0.08;
        }

        .login-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-logo-container {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
          color: white;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }

        .login-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .login-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .error-banner {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--danger);
          margin-bottom: 20px;
        }

        .error-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          height: 46px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0 44px 0 42px;
          font-size: 14px;
          color: var(--text-primary);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
          outline: none;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 0;
        }

        .password-toggle:hover {
          color: var(--text-primary);
        }

        .login-submit-btn {
          height: 46px;
          background: linear-gradient(135deg, var(--primary), #3b82f6);
          color: white;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: filter 0.2s, transform 0.1s;
          margin-top: 8px;
          border: none;
        }

        .login-submit-btn:hover {
          filter: brightness(1.08);
        }

        .login-submit-btn:active {
          transform: scale(0.98);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
