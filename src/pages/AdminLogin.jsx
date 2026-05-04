import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/admin/dashboard', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="h-[3px] bg-accent" />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-[0.25em] text-white uppercase">
              ZEPPELIN<span className="text-accent">.</span>
            </h1>
            <p className="text-gray-500 text-xs tracking-[0.2em] uppercase mt-2">
              Panel de administración
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder-gray-600"
                placeholder="admin@ejemplo.com"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent transition-colors placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-accent text-sm text-center bg-accent/10 border border-accent/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-2.5 rounded-md transition-colors mt-2 uppercase tracking-widest text-sm"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
