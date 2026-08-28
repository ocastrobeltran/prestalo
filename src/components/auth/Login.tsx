import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Partículas Aurora Mint & Obsidian
    const particleCount = 65;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      history: Array<{ x: number; y: number }>;
      color: string;
      speed: number;
      angleOffset: number;
    }> = [];

    const colors = [
      'rgba(0, 242, 157, 0.22)',   // Aurora Mint
      'rgba(56, 189, 248, 0.18)',  // Cyber Blue
      'rgba(139, 92, 246, 0.16)',  // Deep Purple
      'rgba(251, 191, 36, 0.15)'   // Solar Amber
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        history: [],
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.3 + Math.random() * 0.7,
        angleOffset: Math.random() * Math.PI * 2
      });
    }

    let time = 0;

    const render = () => {
      ctx.fillStyle = document.documentElement.classList.contains('dark')
        ? 'rgba(7, 10, 18, 0.12)' 
        : 'rgba(244, 247, 251, 0.12)';
      ctx.fillRect(0, 0, width, height);

      time += 0.0012;

      particles.forEach((p) => {
        const angle = Math.sin(p.x * 0.002 + time) * Math.cos(p.y * 0.002 + time) * Math.PI * 2 + p.angleOffset;
        p.vx = Math.cos(angle) * p.speed;
        p.vy = Math.sin(angle) * p.speed;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > 22) {
          p.history.shift();
        }

        if (p.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.history[0].x, p.history[0].y);
          for (let i = 1; i < p.history.length; i++) {
            ctx.lineTo(p.history[i].x, p.history[i].y);
          }
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        // Registro de usuario nuevo (con 30 días de prueba VIP automática)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMsg('¡Cuenta creada con éxito! Bienvenido a Prestalo.');
        } else {
          setSuccessMsg('¡Registro exitoso! Revisa tu correo para confirmar la cuenta si es necesario, o inicia sesión.');
        }
      } else {
        // Inicio de sesión
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Credenciales incorrectas. Verifica tu correo y contraseña.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('El correo electrónico no ha sido verificado todavía.');
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      setErrorMsg(err.message || 'Ocurrió un error inesperado. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Fondo Canvas Generativo Algorítmico */}
      <canvas ref={canvasRef} className="login-canvas-backdrop" />

      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="login-logo-wrapper">
            <img src="/logo.png" alt="Préstalo Logo" className="login-logo-img" />
          </div>
          <h1 className="login-title">Préstalo</h1>
          <p className="login-subtitle">
            {isRegister ? 'Crea tu cuenta y gestiona tus préstamos' : 'Gestión Inteligente de Cobros y Préstamos'}
          </p>
        </div>

        {errorMsg && (
          <div className="error-banner animate-slide-up">
            <AlertCircle size={18} className="error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-banner animate-slide-up">
            <CheckCircle2 size={18} className="success-icon" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="tu@correo.com"
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
                placeholder="Mínimo 6 caracteres"
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
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>{isRegister ? 'Creando Cuenta...' : 'Iniciando Sesión...'}</span>
              </>
            ) : (
              <span>{isRegister ? 'Crear Cuenta Gratis' : 'Iniciar Sesión'}</span>
            )}
          </button>
        </form>

        <div className="auth-switch-section">
          <button 
            type="button" 
            className="auth-switch-btn" 
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            {isRegister 
              ? '¿Ya tienes una cuenta? Iniciar Sesión' 
              : '¿Nuevo en Prestalo? Crea tu cuenta gratis'}
          </button>
        </div>

        <div className="login-footer">
          <p>Tus datos financieros están 100% aislados y protegidos con cifrado de extremo a extremo.</p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-app);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        .login-canvas-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
          padding: 32px 28px;
          z-index: 10;
        }

        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .login-logo-wrapper {
          width: 76px;
          height: 76px;
          margin: 0 auto 16px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #111828, #1A243C);
          border: 1px solid rgba(0, 242, 157, 0.3);
          border-radius: 22px;
          padding: 10px;
          box-shadow: 0 10px 25px rgba(0, 242, 157, 0.2);
        }

        .login-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 12px;
        }

        .login-title {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.6px;
          background: linear-gradient(135deg, #00F29D 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .login-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .vip-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 242, 157, 0.12);
          border: 1px solid rgba(0, 242, 157, 0.35);
          color: #00F29D;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          margin-top: 14px;
        }

        .error-banner {
          background-color: rgba(255, 56, 92, 0.1);
          border: 1px solid rgba(255, 56, 92, 0.25);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--danger);
          margin-bottom: 18px;
        }

        .success-banner {
          background-color: rgba(0, 242, 157, 0.1);
          border: 1px solid rgba(0, 242, 157, 0.25);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #00F29D;
          margin-bottom: 18px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
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
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          height: 48px;
          background-color: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 0 44px 0 42px;
          font-size: 15px;
          color: var(--text-primary);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 242, 157, 0.15);
          outline: none;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          color: var(--text-tertiary);
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
          height: 50px;
          background: linear-gradient(135deg, #00F29D 0%, #00D68A 100%);
          color: #070A12;
          font-size: 15px;
          font-weight: 800;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 8px;
          box-shadow: 0 6px 20px rgba(0, 242, 157, 0.25);
          border: none;
        }

        .login-submit-btn:active {
          transform: scale(0.97);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-switch-section {
          text-align: center;
          margin-top: 18px;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 6px;
        }

        .auth-switch-btn:hover {
          text-decoration: underline;
        }

        .login-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
