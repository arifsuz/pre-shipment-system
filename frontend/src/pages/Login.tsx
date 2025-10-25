// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogIn, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali kredensial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="auth-card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="brand-logo">PSE</div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Pre-Shipment Entry System</h1>
            <p className="text-sm text-slate-500">Masuk untuk melanjutkan ke dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Username atau Email"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mt-6">
            <Button type="submit" loading={loading} className="w-full" >
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Masuk
              </div>
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-slate-500">
            Lupa kata sandi? Hubungi administrator.
          </div>
        </form>
      </div>
    </div>
  );
};