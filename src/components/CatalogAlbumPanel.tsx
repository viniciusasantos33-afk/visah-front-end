import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Track } from '../types/catalog';
import { extractImagePalette } from '../utils/imagePalette';
import { Icon } from './Icon';

type CatalogAlbumPanelProps = {
  album: Track;
  selectedTrack: Track;
  onClose: () => void;
  onPlaySong: (track: Track) => void;
};

export function CatalogAlbumPanel({
  album,
  selectedTrack,
  onClose,
  onPlaySong,
}: CatalogAlbumPanelProps) {
  const [accent, setAccent] = useState('#b6a389');
  const [textColor, setTextColor] = useState('#161616');
  const songs = album.albumTracks?.length ? album.albumTracks : [album];
  const panelColor = accent
    .match(/\d+/g)
    ?.map(Number)
    .slice(0, 3)
    .map((channel) => Math.round(channel * 0.76))
    .join(', ');
  const style = {
    '--album-accent': accent,
    '--album-panel-color': panelColor ? `rgb(${panelColor})` : '#777067',
    '--album-text': textColor,
  } as CSSProperties;

  useEffect(() => {
    let active = true;
    extractImagePalette(album.image)
      .then(({ accent: color }) => {
        if (!active) return;
        setAccent(color);
        const channels = color.match(/\d+/g)?.map(Number) ?? [182, 163, 137];
        const luminance =
          (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) /
          255;
        setTextColor(luminance > 0.62 ? '#161616' : '#ffffff');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [album.image]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="album-overlay" role="presentation" onClick={onClose}>
      <section
        className="album-panel"
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="album-panel__tag">Álbum</span>
        <button
          className="album-panel__close"
          onClick={onClose}
          aria-label="Fechar álbum"
        >
          <Icon name="close" />
        </button>
        <header className="album-panel__header">
          <h2 id="album-title" title={album.album}>
            {album.album}
          </h2>
          <p>
            {album.artist}
            <Icon name="arrow_forward" />
          </p>
        </header>
        <div
          className="album-tracklist"
          aria-label={`Faixas do álbum ${album.album}`}
        >
          {songs.map((song, index) => {
            const isCurrent = selectedTrack.id === song.id;
            return (
              <button
                className={`album-detail-track${isCurrent ? 'current' : ''}`}
                key={`${song.id}-${index}`}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => onPlaySong(song)}
              >
                <span className="album-detail-track__action">
                  <span title={song.title}>{song.title}</span>
                  <Icon name="arrow_forward" />
                </span>
                <span className="album-detail-track__duration">
                  {song.duration}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
