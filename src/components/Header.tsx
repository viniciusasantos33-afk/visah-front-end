import { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../services/models';
import { Icon } from './Icon';

type HeaderProps = {
  active: string;
  user: UserProfile | null;
  onNavigate: (item: string) => void;
  onLogout: () => void;
};

export function Header({ active, user, onNavigate, onLogout }: HeaderProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!profileMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node))
        setProfileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);
  return (
    <header className={`site-header${user ? '' : 'site-header--guest'}`}>
      <a
        className="brand"
        href="/"
        aria-label="ViSah início"
        onClick={(event) => {
          event.preventDefault();
          if (user) onNavigate('Catálogo');
        }}
      >
        <img src="/Logo.svg" alt="ViSah" />
      </a>
      {user && (
        <nav className="main-nav" aria-label="Navegação principal">
          {(user.role === 'Admin'
            ? ['Explorar', 'Pesquisar', 'Administração']
            : ['Explorar', 'Pesquisar', 'Catálogo']
          ).map((link) => (
            <button
              className={active === link ? 'nav-link active' : 'nav-link'}
              key={link}
              onClick={() => onNavigate(link)}
            >
              {link}
            </button>
          ))}
        </nav>
      )}
      {user && (
        <div className="profile-menu-wrap" ref={profileMenuRef}>
          <button
            className="profile-button"
            aria-label={
              user ? `Menu do perfil de ${user.name}` : 'Entrar ou criar conta'
            }
            aria-expanded={profileMenuOpen}
            onClick={() =>
              user ? setProfileMenuOpen((open) => !open) : onNavigate('Entrar')
            }
          >
            <img src={user.photoUrl || '/profile-placeholder.svg'} alt="" />
          </button>
          {profileMenuOpen && user && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu__identity">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onNavigate('Editar perfil');
                }}
              >
                <Icon name="manage_accounts" />
                Editar perfil
              </button>
              {user.role === 'Admin' && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onNavigate('Administração');
                  }}
                >
                  <Icon name="admin_panel_settings" />
                  Administração
                </button>
              )}
              <button
                role="menuitem"
                className="profile-menu__logout"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
              >
                <Icon name="logout" />
                Fazer log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
