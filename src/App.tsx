import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { RequireAdmin } from './app/guards/RequireAdmin';
import { RequireAuth } from './app/guards/RequireAuth';
import { NotFoundPage } from './app/NotFoundPage';
import { AdminPage } from './components/AdminPage';
import type { ClusterItem } from './components/ArtistAlbumCluster';
import { ArtistDirectory } from './components/ArtistDirectory';
import { AuthPage } from './components/AuthPage';
import { CatalogAlbumPanel } from './components/CatalogAlbumPanel';
import { Header } from './components/Header';
import { Icon } from './components/Icon';
import { DemoPlayer } from './components/DemoPlayer';
import { ProfilePage } from './components/ProfilePage';
import { CatalogPage } from './pages/CatalogPage';
import { useFavorites } from './hooks/useFavorites';
import { clearAuthToken, getAuthToken } from './services/apiClient';
import { getProfile, updateProfile } from './services/profileApi';
import { signOut } from './services/authApi';
import type { UserProfile } from './services/models';
import { buildRecommendations } from './utils/recommendations';
import { useCatalog } from './hooks/useCatalog';
import { useCatalogSearch } from './hooks/useCatalogSearch';
import './App.css';
import './styles/discovery-profile.css';
import './styles/artist-cards.css';
import './styles/catalog-stage.css';
import './styles/player.css';
import './styles/catalog-overlays.css';
import './styles/account-ui.css';
import './styles/catalog-live.css';
import './styles/catalog-overrides.css';
import './styles/admin.css';

function App() {
  const location = useLocation();
  const navigateTo = useNavigate();
  const route =
    location.pathname === '/artistas'
      ? 'artists'
      : location.pathname === '/perfil'
        ? 'profile'
        : location.pathname === '/admin'
          ? 'admin'
          : location.pathname === '/entrar'
            ? 'auth'
            : 'catalog';
  const activeNav =
    route === 'artists'
      ? 'Explorar'
      : route === 'admin'
        ? 'Administração'
        : route === 'profile' || route === 'auth'
          ? ''
          : 'Catálogo';
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getAuthToken()));
  const [catalogError, setCatalogError] = useState('');
  const handleFavoriteError = useCallback(
    (message: string) => setCatalogError(message),
    []
  );
  const { favorites, refreshFavorites, toggleFavorite } =
    useFavorites(handleFavoriteError);
  const {
    tracks,
    visibleTracks,
    artists,
    genres,
    moods,
    genreId,
    setGenreId,
    moodId,
    setMoodId,
    selected,
    setSelected,
    playing,
    setPlaying,
    album,
    setAlbum,
    catalogLoading,
    filterLoading,
    refreshCatalog,
    selectTrack,
  } = useCatalog(user?.id ?? null, refreshFavorites, setCatalogError);
  const search = useCatalogSearch(genreId, moodId, setCatalogError);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigateTo('/entrar', { replace: true });
      return;
    }
    getProfile()
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
        navigateTo('/entrar', { replace: true });
      })
      .finally(() => setAuthLoading(false));
  }, [navigateTo]);

  const navigate = (item: string) => {
    if (!user) {
      navigateTo('/entrar', { replace: true });
      return;
    }
    if (item === 'Pesquisar') {
      search.toggle();
      return;
    }
    search.close();
    if (item === 'Explorar') {
      navigateTo('/artistas');
    } else if (item === 'Perfil' || item === 'Editar perfil') {
      navigateTo('/perfil');
    } else if (
      (item === 'Admin' || item === 'Administração') &&
      user.role === 'Admin'
    ) {
      navigateTo('/admin');
    } else if (item === 'Catálogo' || item === 'Administração') {
      navigateTo('/');
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch {
      clearAuthToken();
    }
    setUser(null);
    setSelected(null);
    setPlaying(false);
    navigateTo('/entrar', { replace: true });
  };

  const authenticated = (profile: UserProfile) => {
    setUser(profile);
    const requestedPath = (
      location.state as { from?: { pathname?: string } } | null
    )?.from?.pathname;
    navigateTo(requestedPath ?? '/perfil', { replace: true });
  };

  const saveProfile = async (name: string, password: string) => {
    if (!user) return;
    await updateProfile({ name, photoUrl: user.photoUrl, password });
    setUser({ ...user, name: name.trim() });
  };

  const filteredGenres = genres.map((genre) => genre.name);
  const filteredMoods = moods.map((mood) => mood.name);
  const selectedGenre =
    genres.find((genre) => genre.id === genreId)?.name ?? '';
  const selectedMood = moods.find((mood) => mood.id === moodId)?.name ?? '';
  const previousClusterTrackIds = useRef<Set<number>>(new Set());

  const clusterItems = useMemo<ClusterItem[]>(
    () =>
      buildRecommendations(
        visibleTracks,
        selected,
        previousClusterTrackIds.current
      ),
    [visibleTracks, selected]
  );
  useEffect(() => {
    previousClusterTrackIds.current = new Set(
      clusterItems.map((item) => item.track.id)
    );
  }, [clusterItems]);

  return (
    <main
      className={`app-shell${route === 'catalog' ? 'app-shell--catalog' : ''}${route === 'artists' ? 'app-shell--artists' : ''}${route === 'profile' ? 'app-shell--profile' : ''}${route === 'auth' ? 'app-shell--auth' : ''}${route === 'admin' ? 'app-shell--admin' : ''}`}
      id="inicio"
    >
      <Header
        active={activeNav}
        user={user}
        onNavigate={navigate}
        onLogout={() => void logout()}
      />
      {search.open && (
        <form
          className="search-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void search.search(search.query);
          }}
        >
          <Icon name="search" />
          <input
            autoFocus
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            placeholder="Busque por música, artista ou álbum"
          />
          <button type="submit" disabled={search.busy}>
            {search.busy ? '…' : 'Buscar'}
          </button>
          <button type="button" onClick={search.close}>
            Esc
          </button>
          {search.results.length > 0 && (
            <div
              className="search-results"
              role="listbox"
              aria-label="Resultados da busca"
            >
              {search.results.slice(0, 8).map((track) => (
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="search-result"
                  key={track.id}
                  onClick={() => {
                    selectTrack(track);
                    search.close();
                  }}
                >
                  <img src={track.image} alt="" />
                  <span>
                    <strong>{track.title}</strong>
                    <small>
                      {track.artist} · {track.album}
                    </small>
                  </span>
                  <Icon name="arrow_forward" />
                </button>
              ))}
            </div>
          )}
        </form>
      )}

      <Routes>
        <Route
          path="/entrar"
          element={
            authLoading ? (
              <div className="catalog-status">
                <span className="catalog-spinner" />
                Verificando sessão…
              </div>
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage onAuthenticated={authenticated} />
            )
          }
        />
        <Route
          element={
            <RequireAuth loading={authLoading} authenticated={Boolean(user)} />
          }
        >
          <Route
            path="/perfil"
            element={
              <ProfilePage
                profile={user!}
                favorites={tracks.filter((track) => favorites.has(track.id))}
                onSave={saveProfile}
                onToggleFavorite={(track) => void toggleFavorite(track)}
              />
            }
          />
          <Route
            path="/artistas"
            element={
              <ArtistDirectory
                artists={artists}
                tracks={tracks}
                moods={filteredMoods}
                selectedMood={selectedMood}
                onSelectMood={(name) =>
                  setMoodId(
                    moods.find((mood) => mood.name === name)?.id ?? moodId
                  )
                }
                onSelectSong={selectTrack}
              />
            }
          />
          <Route element={<RequireAdmin allowed={user?.role === 'Admin'} />}>
            <Route
              path="/admin"
              element={
                <AdminPage
                  tracks={tracks}
                  currentUserId={user?.id ?? 0}
                  onCreated={refreshCatalog}
                />
              }
            />
          </Route>
          <Route
            path="/"
            element={
              <CatalogPage
                genres={filteredGenres}
                moods={filteredMoods}
                genre={selectedGenre}
                mood={selectedMood}
                selected={selected}
                items={clusterItems}
                playing={playing}
                loading={catalogLoading && !tracks.length}
                filterLoading={filterLoading}
                error={catalogError}
                onGenreChange={(name) =>
                  setGenreId(
                    genres.find((genre) => genre.name === name)?.id ?? genreId
                  )
                }
                onMoodChange={(name) =>
                  setMoodId(
                    moods.find((mood) => mood.name === name)?.id ?? moodId
                  )
                }
                onSelectTrack={selectTrack}
                onTogglePlayback={() => setPlaying((value) => !value)}
                onOpenAlbum={setAlbum}
              />
            }
          />
        </Route>
        <Route
          path="*"
          element={<NotFoundPage authenticated={Boolean(user)} />}
        />
      </Routes>

      <DemoPlayer track={selected} />
      {album && selected && (
        <CatalogAlbumPanel
          album={album}
          selectedTrack={selected}
          onClose={() => setAlbum(null)}
          onPlaySong={(track) => selectTrack(track)}
        />
      )}
    </main>
  );
}

export default App;
