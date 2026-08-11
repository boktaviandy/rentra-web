import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  AlertCircle,
  Trash2,
  Sparkles
} from 'lucide-react';
import '../components/ui/Toast.css';


const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // { isOpen, title, message, confirmText, cancelText, variant, resolve }
  const toastIdRef = useRef(0);

  const addToast = useCallback(({ type = 'success', title, message, duration = 3500 }) => {
    const id = ++toastIdRef.current;
    const newToast = { id, type, title, message, duration };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
  };

  const confirm = useCallback(({
    title = 'Konfirmasi Tindakan',
    message = 'Apakah Anda yakin ingin melanjutkan?',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    variant = 'danger' // 'danger' | 'primary'
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        resolve: (val) => {
          setConfirmState(null);
          resolve(val);
        }
      });
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm, addToast, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="toast-portal-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <div className="toast-icon-wrap">
              {t.type === 'success' && <CheckCircle2 size={20} className="icon-success" />}
              {t.type === 'error' && <XCircle size={20} className="icon-error" />}
              {t.type === 'warning' && <AlertTriangle size={20} className="icon-warning" />}
              {t.type === 'info' && <Info size={20} className="icon-info" />}
            </div>

            <div className="toast-content">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>

            <button
              className="toast-close-btn"
              onClick={() => removeToast(t.id)}
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Premium Confirm Dialog Modal */}
      {confirmState && confirmState.isOpen && (
        <div className="confirm-overlay" onClick={() => confirmState.resolve(false)}>
          <div className="confirm-modal-box card" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon-circle variant-${confirmState.variant}`}>
              {confirmState.variant === 'danger' ? (
                <Trash2 size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
            </div>

            <h3 className="confirm-title">{confirmState.title}</h3>
            <p className="confirm-message">{confirmState.message}</p>

            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => confirmState.resolve(false)}
              >
                {confirmState.cancelText}
              </button>
              <button
                className={`btn ${confirmState.variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => confirmState.resolve(true)}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
