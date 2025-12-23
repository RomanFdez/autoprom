import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Credenciales incorrectas');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Bienvenido</h2>
                    <p>Inicia sesión para gestionar tus finanzas</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-msg">{error}</div>}

                    <div className="input-field">
                        <label>Usuario</label>
                        <div className="input-wrapper">
                            <User size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Usuario"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-field">
                        <label>Contraseña</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-btn">Entrar</button>
                </form>
                <div className="login-footer">
                    <small>Usuario por defecto: admin / admin123</small>
                </div>
            </div>

            <style>{`
                .login-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                    padding: 1rem;
                }
                .login-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .login-header h2 { margin-bottom: 0.5rem; }
                .login-header p { color: #666; margin: 0; font-size: 0.9rem; }
                
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .input-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .input-field label {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #333;
                }
                .input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f9f9f9;
                    border: 1px solid #eee;
                    padding: 12px;
                    border-radius: 12px;
                    transition: border-color 0.2s;
                }
                .input-wrapper:focus-within {
                    border-color: var(--md-sys-color-primary, #4caf50);
                }
                .input-wrapper input {
                    border: none;
                    background: none;
                    flex: 1;
                    outline: none;
                }
                .input-wrapper svg { color: #999; }
                
                .login-btn {
                    background: var(--md-sys-color-primary, #4caf50);
                    color: white;
                    border: none;
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 0.5rem;
                    transition: opacity 0.2s;
                }
                .login-btn:hover { opacity: 0.9; }
                
                .error-msg {
                    background: #ffebee;
                    color: #d32f2f;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    text-align: center;
                }
                .login-footer {
                    margin-top: 2rem;
                    text-align: center;
                    color: #999;
                }
            `}</style>
        </div>
    );
}
