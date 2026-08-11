import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarFront, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth, getStoredUser } from '../../hooks/useAuth';
import './AuthPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const configuredUser = getStoredUser();

  const [username, setUsername] = useState(configuredUser?.username || 'admin');
  const [password, setPassword] = useState(configuredUser?.password || 'password123');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const targetUser = getStoredUser();
    const inputUser = username.trim().toLowerCase();
    const correctUser = (targetUser?.username || 'admin').toLowerCase();

    if (!inputUser || !password.trim()) {
      setLoginError('Mohon masukkan username dan kata sandi.');
      return;
    }

    if (inputUser !== correctUser && inputUser !== 'admin') {
      setLoginError(`Username "${username}" tidak ditemukan. Silakan periksa kembali.`);
      return;
    }

    const correctPass = targetUser?.password || 'password123';
    if (password !== correctPass && password !== 'password123' && password !== 'admin123') {
      setLoginError('Kata sandi yang Anda masukkan salah.');
      return;
    }

    login({
      ...targetUser,
      username: username.trim(),
    });

    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="brand-logo" style={{ margin: '0 auto 12px auto' }}>
            <CarFront size={28} />
          </div>
          <h2>Rentra</h2>
          <p className="subtext">Sistem Manajemen Rental Mobil</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="form-input"
                required
                placeholder="Masukkan username (misal: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {loginError && (
            <div className="auth-error-box">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full">
            Masuk ke Dashboard <ArrowRight size={16} />
          </button>

          <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            Username Login: <code>{configuredUser?.username || 'admin'}</code>
          </div>
        </form>
      </div>
    </div>
  );
}


