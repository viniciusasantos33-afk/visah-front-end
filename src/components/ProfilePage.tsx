import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from './Icon';
import type { UserProfile } from '../services/models';
import type { Track } from '../types/catalog';

const avatar = '/profile-placeholder.svg';

type ProfilePageProps = {
  profile: UserProfile;
  favorites: Track[];
  onSave: (name: string, password: string) => Promise<void>;
  onToggleFavorite: (track: Track) => void;
};

export function ProfilePage({
  profile,
  favorites,
  onSave,
  onToggleFavorite,
}: ProfilePageProps) {
  const [name, setName] = useState(profile.name);
  const [editingName, setEditingName] = useState(false);
  const [nameRowWidth, setNameRowWidth] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const nameRowRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setName(profile.name), [profile.name]);

  const measureTextWidth = (text: string, element: HTMLElement | null) => {
    if (!element) return text.length * 14;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return text.length * 14;
    const style = window.getComputedStyle(element);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return Math.ceil(context.measureText(text).width);
  };

  const toggleNameEditor = () => {
    if (editingName) {
      const mobileScale = window.matchMedia('(max-width: 760px)').matches
        ? 0.68
        : 0.7;
      const maxWidth = Math.min(540, window.innerWidth * mobileScale - 32);
      setNameRowWidth(
        Math.min(measureTextWidth(name, nameInputRef.current) + 14, maxWidth)
      );
      setEditingName(false);
      return;
    }

    const currentWidth =
      nameRowRef.current?.getBoundingClientRect().width ?? 300;
    const mobileScale = window.matchMedia('(max-width: 760px)').matches
      ? 0.68
      : 0.7;
    const maxWidth = Math.min(540, window.innerWidth * mobileScale - 32);
    setNameRowWidth(currentWidth);
    setEditingName(true);
    requestAnimationFrame(() =>
      setNameRowWidth(Math.min(maxWidth, Math.max(currentWidth + 120, 340)))
    );
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingName) toggleNameEditor();
    setError('');
    try {
      await onSave(name, password);
      setPassword('');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o perfil.'
      );
    }
  };

  return (
    <section className="profile-page" aria-label="Editar perfil">
      <div className="profile-page__content">
        <header className="profile-hero">
          <img
            className="profile-hero__avatar"
            src={profile.photoUrl || avatar}
            alt={`Foto de perfil de ${profile.name}`}
          />
          <div className="profile-hero__details">
            <div className="profile-hero__name-row">
              <div
                className="profile-hero__name-field"
                ref={nameRowRef}
                style={nameRowWidth ? { width: nameRowWidth } : undefined}
              >
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    className="profile-hero__name-input"
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-label="Nome do perfil"
                  />
                ) : (
                  <h1>{name}</h1>
                )}
              </div>
              <button
                className="profile-edit-icon"
                type="button"
                aria-label="Editar nome"
                onClick={toggleNameEditor}
              >
                <Icon name={editingName ? 'check' : 'edit'} />
              </button>
            </div>
            <div className="profile-hero__bio-row">
              <span className="profile-hero__bio">{profile.email}</span>
            </div>
          </div>
        </header>

        <form className="profile-form" onSubmit={saveProfile}>
          <div className="profile-form__heading">
            <h2>Editar perfil</h2>
            <button type="submit" className="profile-save-button">
              {saved ? 'Alterações salvas' : 'Salvar alterações'}
            </button>
          </div>
          <div className="profile-form__fields">
            <label>
              <span>E-mail</span>
              <input type="email" value={profile.email} readOnly />
            </label>
            <label>
              <span>
                Nova senha <small>(opcional)</small>
              </span>
              <input
                type="password"
                minLength={password ? 8 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Deixe em branco para manter"
              />
            </label>
          </div>
          {error && (
            <p className="profile-form__error" role="alert">
              {error}
            </p>
          )}
        </form>

        <section
          className="profile-favorites"
          aria-labelledby="profile-favorites-heading"
        >
          <div className="profile-favorites__heading">
            <h2 id="profile-favorites-heading">Músicas curtidas</h2>
            <span>{favorites.length} músicas</span>
          </div>
          <ol className="profile-favorites__list">
            {favorites.map((track, index) => (
              <li className="profile-favorite" key={track.id}>
                <span className="profile-favorite__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="profile-favorite__info">
                  <strong>{track.title}</strong>
                  <small>{track.artist}</small>
                </div>
                <span className="profile-favorite__duration">
                  {track.duration}
                </span>
                <button
                  type="button"
                  className="profile-favorite__heart"
                  aria-label={`Descurtir ${track.title}`}
                  onClick={() => onToggleFavorite(track)}
                >
                  <Icon name="favorite" />
                </button>
              </li>
            ))}
            {favorites.length === 0 && (
              <li className="profile-favorites__empty">
                Você ainda não curtiu músicas.
              </li>
            )}
          </ol>
        </section>
      </div>
    </section>
  );
}
