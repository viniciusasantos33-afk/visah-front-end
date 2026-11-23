import {
  ArtistAlbumCluster,
  type ClusterItem,
} from '../components/ArtistAlbumCluster';
import { CircularFilters } from '../components/CircularFilters';
import { Icon } from '../components/Icon';
import type { Track } from '../types/catalog';

type CatalogPageProps = {
  genres: string[];
  moods: string[];
  genre: string;
  mood: string;
  selected: Track | null;
  items: ClusterItem[];
  playing: boolean;
  loading: boolean;
  filterLoading: boolean;
  error: string;
  onGenreChange: (genre: string) => void;
  onMoodChange: (mood: string) => void;
  onSelectTrack: (track: Track) => void;
  onTogglePlayback: () => void;
  onOpenAlbum: (track: Track) => void;
};

export function CatalogPage({
  genres,
  moods,
  genre,
  mood,
  selected,
  items,
  playing,
  loading,
  filterLoading,
  error,
  onGenreChange,
  onMoodChange,
  onSelectTrack,
  onTogglePlayback,
  onOpenAlbum,
}: CatalogPageProps) {
  return (
    <>
      <div className="catalog-orbit">
        <div className="catalog-frame" aria-hidden="true" />
        <CircularFilters
          genres={genres}
          moods={moods}
          genre={genre}
          mood={mood}
          onGenreChange={onGenreChange}
          onMoodChange={onMoodChange}
        />
      </div>
      {error && (
        <p className="catalog-toast" role="alert">
          <Icon name="error" />
          {error}
        </p>
      )}
      {loading ? (
        <div className="catalog-status">
          <span className="catalog-spinner" />
          Carregando o catálogo…
        </div>
      ) : selected ? (
        <ArtistAlbumCluster
          items={items}
          currentTrack={selected}
          isPlaying={playing}
          onSelectTrack={onSelectTrack}
          onTogglePlayback={onTogglePlayback}
          onOpenAlbum={onOpenAlbum}
        />
      ) : (
        <div className={`catalog-status${filterLoading ? 'is-loading' : ''}`}>
          <Icon name={filterLoading ? 'hourglass_top' : 'music_off'} />
          {filterLoading
            ? 'Atualizando recomendações…'
            : `Nenhuma música para ${genre || 'este gênero'} · ${mood || 'este mood'}.`}
        </div>
      )}
    </>
  );
}
