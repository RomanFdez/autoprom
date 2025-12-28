import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

export default function Login() {
    const { loginWithGoogle, loginWithEmail } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        const success = await loginWithGoogle();
        if (success) {
            navigate('/');
        } else {
            setError('Error al iniciar sesión con Google');
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        const res = await loginWithEmail(email, password);
        if (res.success) {
            navigate('/');
        } else {
            // Translate common Firebase errors if possible, or show generic
            console.error(res.error);
            setError('Error al iniciar sesión. Verifica tus credenciales.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Bienvenido</h2>
                    <p>Inicia sesión para gestionar tus finanzas</p>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <div className="login-actions">
                    <button onClick={handleGoogleLogin} className="google-btn">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                        <span>Continuar con Google</span>
                    </button>

                    <div className="separator">
                        <span>o</span>
                    </div>

                    <form onSubmit={handleEmailLogin} className="email-form">
                        <div className="input-group">
                            <label>Correo electrónico</label>
                            <div className="input-wrapper">
                                <User size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="nombre@ejemplo.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <Lock size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-btn">Entrar</button>
                    </form>
                </div>
            </div>

            <style>{`
                .login-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background-color: var(--md-sys-color-background);
                    padding: 1rem;
                }
                .login-card {
                    background: var(--md-sys-color-surface);
                    padding: 3rem 2rem;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    color: var(--md-sys-color-on-surface);
                    text-align: center;
                }
                .login-header {
                    margin-bottom: 2rem;
                }
                .login-header h2 { margin-bottom: 0.5rem; }
                .login-header p { color: var(--md-sys-color-on-surface); opacity: 0.7; margin: 0; font-size: 0.9rem; }
                
                .google-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    gap: 12px;
                    background: white;
                    color: #757575;
                    border: 1px solid #ddd;
                    padding: 12px;
                    border-radius: 24px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                    font-size: 1rem;
                    font-family: 'Roboto', sans-serif;
                }
                .google-btn:hover {
                    background: #f1f1f1;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                .separator {
                    margin: 1.5rem 0;
                    position: relative;
                    text-align: center;
                }
                .separator::before {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: var(--md-sys-color-outline-variant);
                    z-index: 1;
                }
                .separator span {
                    background: var(--md-sys-color-surface);
                    padding: 0 1rem;
                    position: relative;
                    z-index: 2;
                    color: var(--md-sys-color-on-surface-variant);
                    font-size: 0.9rem;
                }

                .email-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    text-align: left;
                }
                .input-group label {
                    display: block;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: var(--md-sys-color-surface-variant);
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid transparent;
                }
                .input-wrapper:focus-within {
                    border-color: var(--md-sys-color-primary, #4caf50);
                    background: var(--md-sys-color-surface);
                }
                .input-wrapper input {
                    border: none;
                    background: none;
                    flex: 1;
                    outline: none;
                    color: var(--md-sys-color-on-surface);
                }
                .input-wrapper svg { color: var(--md-sys-color-on-surface-variant); }

                .login-btn {
                    background: var(--md-sys-color-primary, #4caf50);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 0.5rem;
                    width: 100%;
                }
                .login-btn:hover { opacity: 0.9; }

                .error-msg {
                    background: #ffebee;
                    color: #d32f2f;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    text-align: center;
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
}
