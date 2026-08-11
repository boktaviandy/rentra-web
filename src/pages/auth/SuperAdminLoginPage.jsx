import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import './AuthPage.css';

export function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('superadmin@rentra.id');
  const [password, setPassword] = useState('admin123');

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/superadmin/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="brand-logo" style={{ margin: '0 auto 12px auto', background: 'var(--danger)' }}>
            <ShieldCheck size={28} />
          </div>
          <h2>Super Admin Portal</h2>
          <p className="subtext">Platform Management SaaS Rentra</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Super Admin</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi Platform</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-danger btn-full">
            Masuk Portal Super Admin <ArrowRight size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
