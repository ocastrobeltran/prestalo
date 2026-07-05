import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    // Parámetros de la simulación "Emergent Flow"
    const particleCount = 70;
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
      'rgba(6, 182, 212, 0.15)',  // Cyan
      'rgba(13, 148, 136, 0.15)',  // Teal
      'rgba(16, 185, 129, 0.15)',  // Emerald
      'rgba(14, 165, 233, 0.15)'   // Sky Blue
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
        ? 'rgba(8, 12, 20, 0.08)' 
        : 'rgba(248, 250, 252, 0.08)';
      ctx.fillRect(0, 0, width, height);

      time += 0.001;

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
        if (p.history.length > 20) {
          p.history.shift();
        }

        if (p.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.history[0].x, p.history[0].y);
          for (let i = 1; i < p.history.length; i++) {
            ctx.lineTo(p.history[i].x, p.history[i].y);
          }
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
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
      {/* Fondo Canvas Generativo Algorítmico */}
      <canvas ref={canvasRef} className="login-canvas-backdrop" />

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

        /* Fondo Canvas Generativo Algorítmico */
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
