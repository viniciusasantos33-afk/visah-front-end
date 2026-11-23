import { useState, type FormEvent } from 'react';
import { signIn, signUp } from '../services/authApi';
import { clearAuthToken, saveAuthToken } from '../services/apiClient';
import { getProfile } from '../services/profileApi';
import type { UserProfile } from '../services/models';
import { Icon } from './Icon';

type AuthPageProps = { onAuthenticated: (profile: UserProfile) => void };
type AuthMode = 'login' | 'register';

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result =
        mode === 'login'
          ? await signIn(email, password)
          : await signUp(name, email, password);
      saveAuthToken(result.token);
      const profile = await getProfile();
      onAuthenticated(profile);
    } catch (requestError) {
      clearAuthToken();
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível acessar sua conta.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="auth-page"
      aria-label={mode === 'login' ? 'Entrar na ViSah' : 'Criar conta na ViSah'}
    >
      <div className="auth-card">
        <aside className="auth-card__story">
          <div className="auth-card__glow auth-card__glow--one" />
          <div className="auth-card__glow auth-card__glow--two" />
          <span className="auth-card__eyebrow">
            <Icon name="graphic_eq" /> Sua música, no seu ritmo
          </span>
          <div className="auth-card__message">
            <span className="auth-card__orb auth-card__orb--large" />
            <span className="auth-card__orb auth-card__orb--small" />
            <span className="auth-card__note auth-card__note--one">♪</span>
            <span className="auth-card__note auth-card__note--two">♫</span>
            <h1>Encontre o som que combina com você.</h1>
            <p>Descubra artistas, álbuns e músicas para cada momento.</p>
          </div>
          <span className="auth-card__footnote">
            ViSah · Música para sentir
          </span>
        </aside>

        <div className="auth-card__form-side">
          <div
            className="auth-mode-switch"
            role="tablist"
            aria-label="Acesso à conta"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Criar conta
            </button>
          </div>

          <div className="auth-heading">
            <span className="auth-heading__icon">
              <Icon name={mode === 'login' ? 'waving_hand' : 'auto_awesome'} />
            </span>
            <h2>
              {mode === 'login'
                ? 'Que bom ter você de volta'
                : 'Sua próxima descoberta começa aqui'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Entre para continuar sua experiência.'
                : 'Crie sua conta e monte sua própria jornada musical.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <label className="auth-field">
                <span>Seu nome</span>
                <div className="auth-field__control">
                  <Icon name="person" />
                  <input
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Como podemos te chamar?"
                  />
                </div>
              </label>
            )}
            <label className="auth-field">
              <span>E-mail</span>
              <div className="auth-field__control">
                <Icon name="mail" />
                <input
                  autoComplete="email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                />
              </div>
            </label>
            <label className="auth-field">
              <span>Senha</span>
              <div className="auth-field__control">
                <Icon name="lock" />
                <input
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    mode === 'register'
                      ? 'Pelo menos 8 caracteres'
                      : 'Sua senha'
                  }
                />
              </div>
            </label>
            {error && (
              <p className="auth-error" role="alert">
                <Icon name="error" />
                {error}
              </p>
            )}
            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting
                ? 'Aguarde…'
                : mode === 'login'
                  ? 'Entrar na ViSah'
                  : 'Criar minha conta'}
              {!submitting && <Icon name="arrow_forward" />}
            </button>
          </form>
          <p className="auth-terms">
            Ao continuar, você concorda com uma experiência feita para descobrir
            música.
          </p>
        </div>
      </div>
    </section>
  );
}
