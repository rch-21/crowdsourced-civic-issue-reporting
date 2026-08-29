import { useState } from 'react';
import { login, register, verify } from './api';

export function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'login') {
        await login(email, password);
        onLogin();
      } else if (mode === 'register') {
        const created = await register(name, email, password);
        setToken(created.verificationToken);
        setMessage('Account created. Verify your account with the development verification token below. No email provider is configured.');
        setMode('verify');
      } else {
        await verify(token);
        setMessage('Account verified. You can now sign in.');
        setMode('login');
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Unable to complete the request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">CIVIC INTELLIGENCE</p>
        <h1>
          {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your citizen account' : 'Verify your account'}
        </h1>
        <p className="muted">
          {mode === 'login'
            ? 'Sign in to report issues, track municipal response, and follow civic work.'
            : mode === 'register'
              ? 'Use a real email address and a password of at least 12 characters.'
              : 'Development verification is shown here because no delivery provider is configured.'}
        </p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Full name
              <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
          )}
          {mode !== 'verify' && (
            <>
              <label>
                Email
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </label>
              <label>
                Password
                <input required minLength={12} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </label>
            </>
          )}
          {mode === 'verify' && (
            <label>
              Verification token
              <input required value={token} onChange={(e) => setToken(e.target.value)} />
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy ? 'Working…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Verify account'}
          </button>
        </form>
        {message && (
          <div className="notice" role="status">
            {message}
            {mode === 'verify' && token && <code>{token}</code>}
          </div>
        )}
        <div className="auth-links">
          {mode !== 'login' && <button type="button" onClick={() => setMode('login')}>Back to sign in</button>}
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('register')}>Create account</button>
              <button type="button" onClick={() => setMode('verify')}>I have a verification token</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
