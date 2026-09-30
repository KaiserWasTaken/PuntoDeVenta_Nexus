import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { login } from '../services/api.js';

export function LoginForm({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login({ email, password });
      onAuthenticated(user);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-brand-light p-8 shadow-2xl">
        <div className="mb-8">
          <p className="font-accent text-[10px] text-brand-blue">NEXUS POS</p>
          <h1 className="font-display mt-2 text-4xl text-brand-dark">Iniciar sesión</h1>
          <p className="mt-2 font-exo text-brand-dark/60">Acceso al panel operativo</p>
        </div>
        {error && <p className="mb-4 rounded-xl bg-brand-dark p-3 font-exo text-sm text-brand-gold">{error}</p>}
        <label className="label">Correo</label>
        <input className="input mb-4" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
        <label className="label">Contraseña</label>
        <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gold px-4 py-3 font-exo font-bold text-brand-dark disabled:opacity-50">
          <LogIn size={18} /> {busy ? 'Validando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
