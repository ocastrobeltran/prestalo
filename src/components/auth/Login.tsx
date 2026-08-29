import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { storageService } from '../../services/storageService';
import { 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Phone, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot_password' | 'update_password';

export const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Campos de formulario
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Escuchar si el usuario llegó a través de un enlace de recuperación de contraseña
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update_password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fondo Canvas Generativo de Partículas Aurora Mint
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

    const particleCount = 60;
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Manejo de recuperación de contraseña
    if (authMode === 'forgot_password') {
      if (!email) {
        setErrorMsg('Por favor ingresa tu correo electrónico.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin
        });
        if (error) throw error;
        setSuccessMsg('¡Enlace enviado! Revisa tu bandeja de entrada o spam para restablecer tu contraseña.');
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al enviar el correo de recuperación.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Manejo de actualización de contraseña nueva
    if (authMode === 'update_password') {
      if (password.length < 6) {
        setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccessMsg('¡Contraseña actualizada exitosamente! Iniciando sesión...');
        setTimeout(() => {
          setAuthMode('login');
        }, 2000);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al actualizar la contraseña.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Manejo de Registro
    if (authMode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg('Por favor ingresa tu nombre completo.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Por favor ingresa tu número de teléfono / WhatsApp.');
        return;
      }
      if (!email.trim() || !password) {
        setErrorMsg('Por favor completa todos los campos obligatorios.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              business_name: businessName.trim(),
              phone: phone.trim()
            }
          }
        });

        if (error) throw error;

        // Guardar datos en perfil local
        storageService.saveUserProfile({
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          email: email.trim()
        });

        if (data?.session) {
          setSuccessMsg('¡Cuenta creada con éxito! Bienvenido a Prestalo.');
        } else {
          setSuccessMsg('¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.');
          setTimeout(() => setAuthMode('login'), 2500);
        }
      } catch (err: any) {
        console.error('Error al registrar:', err);
        setErrorMsg(err.message || 'Error al crear la cuenta.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 4. Manejo de Inicio de Sesión
    if (authMode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Por favor ingresa tu correo y contraseña.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Correo o contraseña incorrectos.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('El correo electrónico aún no ha sido confirmado.');
          } else {
            throw error;
          }
        }
      } catch (err: any) {
        console.error('Error de inicio de sesión:', err);
        setErrorMsg(err.message || 'Error al iniciar sesión.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Fondo Canvas Generativo */}
      <canvas ref={canvasRef} className="login-canvas-backdrop" />

      <div className="login-card animate-fade-in">
        {authMode !== 'login' && authMode !== 'update_password' && (
          <button 
            type="button" 
            className="login-back-btn" 
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            <ArrowLeft size={16} />
            <span>Volver a Iniciar Sesión</span>
          </button>
        )}

        <div className="login-header">
          <div className="login-logo-wrapper">
            <img src="/logo.png" alt="Préstalo Logo" className="login-logo-img" />
          </div>
          <h1 className="login-title">Préstalo</h1>
          <p className="login-subtitle">
            {authMode === 'register' && 'Crea tu cuenta y comienza a gestionar tus créditos'}
            {authMode === 'login' && 'Gestión Inteligente de Cobros y Préstamos'}
            {authMode === 'forgot_password' && 'Recuperación de Contraseña'}
            {authMode === 'update_password' && 'Crea tu nueva contraseña'}
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
          {/* CAMPOS ADICIONALES PARA REGISTRO */}
          {authMode === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Nombre Completo *</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-business">Nombre de tu Negocio / Cartera (Opcional)</label>
                <div className="input-wrapper">
                  <Building2 className="input-icon" size={18} />
                  <input
                    id="reg-business"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Inversiones El Trébol"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Teléfono / WhatsApp de Cobranza *</label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input
                    id="reg-phone"
                    type="tel"
                    className="form-input"
                    placeholder="Ej. +57 300 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* CAMPO DE EMAIL (LOGIN, REGISTER, FORGOT) */}
          {authMode !== 'update_password' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Correo Electrónico *</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="auth-email"
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
          )}

          {/* CAMPO DE CONTRASEÑA (LOGIN, REGISTER, UPDATE) */}
          {authMode !== 'forgot_password' && (
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label" htmlFor="auth-password">
                  {authMode === 'update_password' ? 'Nueva Contraseña *' : 'Contraseña *'}
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => {
                      setAuthMode('forgot_password');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="auth-password"
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
          )}

          {/* CONFIRMAR CONTRASEÑA EN REGISTRO O ACTUALIZACIÓN */}
          {(authMode === 'register' || authMode === 'update_password') && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-pass">Confirmar Contraseña *</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="auth-confirm-pass"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>
                {authMode === 'login' && 'Iniciar Sesión'}
                {authMode === 'register' && 'Crear Cuenta'}
                {authMode === 'forgot_password' && 'Enviar Enlace de Recuperación'}
                {authMode === 'update_password' && 'Guardar Nueva Contraseña'}
              </span>
            )}
          </button>
        </form>

        {/* CAMBIO ENTRE LOGIN Y REGISTRO */}
        {authMode === 'login' && (
          <div className="auth-switch-section">
            <button 
              type="button" 
              className="auth-switch-btn" 
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              ¿No tienes cuenta? <strong>Regístrate gratis</strong>
            </button>
          </div>
        )}

        {authMode === 'register' && (
          <div className="auth-switch-section">
            <button 
              type="button" 
              className="auth-switch-btn" 
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              ¿Ya tienes una cuenta? <strong>Inicia Sesión</strong>
            </button>
          </div>
        )}

        <div className="login-footer">
          <p>Tus datos financieros están 100% aislados y protegidos con cifrado de extremo a extremo.</p>
        </div>
      </div>

      <style>{`
        .login-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background-color: var(--bg-app);
          z-index: 1000;
          overflow-y: auto;
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
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(17, 24, 40, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 242, 157, 0.25);
          border-radius: 24px;
          padding: 30px 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(0, 242, 157, 0.08);
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin: auto;
        }

        .login-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 10px;
          align-self: flex-start;
          cursor: pointer;
        }

        .login-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .login-logo-wrapper {
          height: 60px;
          width: 60px;
          border-radius: 18px;
          background: linear-gradient(135deg, #111828, #1A243C);
          border: 1px solid rgba(0, 242, 157, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0, 242, 157, 0.25);
          margin-bottom: 2px;
        }

        .login-logo-img {
          height: 38px;
          width: 38px;
          object-fit: contain;
        }

        .login-title {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #00F29D 0%, #38BDF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
          max-width: 320px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          height: 44px;
          padding-left: 38px;
          padding-right: 38px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 242, 157, 0.15);
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .password-toggle:hover {
          color: var(--text-primary);
        }

        .login-submit-btn {
          height: 46px;
          margin-top: 4px;
          background: linear-gradient(135deg, #00F29D 0%, #00D88B 100%);
          color: #070A12;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 242, 157, 0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .login-submit-btn:active {
          transform: scale(0.98);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-switch-section {
          text-align: center;
          border-top: 1px solid var(--border-color);
          padding-top: 14px;
        }

        .auth-switch-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .auth-switch-btn strong {
          color: var(--primary);
        }

        .login-footer {
          text-align: center;
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }

        .error-banner {
          background: rgba(255, 56, 92, 0.1);
          border: 1px solid rgba(255, 56, 92, 0.3);
          color: #FF385C;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .success-banner {
          background: rgba(0, 242, 157, 0.1);
          border: 1px solid rgba(0, 242, 157, 0.3);
          color: #00F29D;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
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
