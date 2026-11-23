import type { Track } from '../types/catalog';
import { Icon } from './Icon';

export type MusicBubbleVariant = 'music' | 'playing' | 'album';

type MusicBubbleProps = {
  track: Track;
  variant: MusicBubbleVariant;
  slot: number;
  onSelect: (track: Track) => void;
  onOpenAlbum: (track: Track) => void;
};

export function MusicBubble({
  track,
  variant,
  slot,
  onSelect,
  onOpenAlbum,
}: MusicBubbleProps) {
  const hasAlbum = Boolean(track.songs?.length);

  return (
    <article
      className={`music-item music-item--${variant} music-item--slot-${slot}`}
    >
      <button
        className="music-art"
        style={{ backgroundImage: `url("${track.image}")` }}
        aria-label={`Reproduzir ${track.title}, de ${track.artist}`}
        onClick={() => onSelect(track)}
      >
        <span className="music-caption">
          <strong>{track.title}</strong>
          <small>{track.artist}</small>
        </span>
        {variant === 'playing' && (
          <span className="music-play">
            <Icon name="play_arrow" />
          </span>
        )}
      </button>
      {hasAlbum && (
        <button className="music-album-tag" onClick={() => onOpenAlbum(track)}>
          <Icon name="album" /> Álbum
        </button>
      )}
    </article>
  );
}
