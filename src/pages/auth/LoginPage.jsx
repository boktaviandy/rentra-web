import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarFront, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AuthPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Mohon masukkan email dan kata sandi.');
      return;
    }

    const result = await login(email, password);

    if (result?.success) {
      navigate('/dashboard');
    }
  };

  const displayError = localError || authError;

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
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                required
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
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
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
          </div>

          {displayError && (
            <div className="auth-error-box">
              <AlertCircle size={16} />
              <span>{displayError}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Memverifikasi...
              </>
            ) : (
              <>
                Masuk ke Dashboard <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
