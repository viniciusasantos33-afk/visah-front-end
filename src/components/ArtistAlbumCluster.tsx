import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import type { Track } from '../types/catalog';
import { Icon } from './Icon';
import { extractImagePalette } from '../utils/imagePalette';

export type ClusterItem = {
  id: string;
  name: string;
  image: string;
  listeners: number;
  type: 'artist' | 'album' | 'track';
  track: Track;
};

type ArtistAlbumClusterProps = {
  items: ClusterItem[];
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onTogglePlayback: () => void;
  onOpenAlbum: (track: Track) => void;
};

function ClusterNode({
  item,
  x,
  y,
  size,
  delay,
  onSelectTrack,
  onOpenAlbum,
}: {
  item: ClusterItem;
  x: number;
  y: number;
  size: number;
  delay: number;
  onSelectTrack: (track: Track) => void;
  onOpenAlbum: (track: Track) => void;
}) {
  const [accent, setAccent] = useState('#b6a389');
  const [textColor, setTextColor] = useState('#161616');

  useEffect(() => {
    if (item.type !== 'album') return;
    let active = true;
    extractImagePalette(item.image)
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
  }, [item.image, item.type]);

  const style = {
    '--cluster-x': `${x}%`,
    '--cluster-y': `${y}%`,
    '--cluster-size': `${size}px`,
    '--cluster-delay': `${delay}ms`,
  } as CSSProperties;

  return (
    <article className="cluster-item" style={style}>
      <button
        className="cluster-item__art"
        style={{ backgroundImage: `url("${item.image}")` }}
        onClick={(event) => {
          event.stopPropagation();
          if (item.type === 'album') onOpenAlbum(item.track);
          else onSelectTrack(item.track);
        }}
        aria-label={
          item.type === 'album'
            ? `Abrir álbum ${item.name}`
            : `Reproduzir ${item.track.title}, de ${item.track.artist}`
        }
      >
        <span className="cluster-item__caption">
          <strong>{item.track.title}</strong>
          <small>{item.track.artist}</small>
        </span>
      </button>
      {item.type === 'album' && (
        <button
          className="cluster-item__tag"
          style={{ backgroundColor: accent, color: textColor }}
          onClick={(event) => {
            event.stopPropagation();
            onOpenAlbum(item.track);
          }}
          aria-label={`Abrir álbum ${item.name}`}
        >
          Álbum
        </button>
      )}
    </article>
  );
}

const positions = [
  [50, 18.5],
  [67.4, 25.2],
  [76.6, 43],
  [73.4, 65.8],
  [59.2, 79.6],
  [40.8, 79.6],
  [26.6, 65.8],
  [23.4, 43],
  [32.6, 25.2],
];

export function ArtistAlbumCluster({
  items,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onTogglePlayback,
  onOpenAlbum,
}: ArtistAlbumClusterProps) {
  const [accent, setAccent] = useState('#d9b99d');
  const minListeners = Math.min(
    ...items.map((item) => item.listeners),
    currentTrack.listeners
  );
  const maxListeners = Math.max(
    ...items.map((item) => item.listeners),
    currentTrack.listeners
  );
  const sizeFor = (listeners: number) => {
    const range = maxListeners - minListeners || 1;
    const popularity = (listeners - minListeners) / range;
    return Math.round(156 + Math.sqrt(popularity) * 16);
  };

  useEffect(() => {
    let active = true;
    extractImagePalette(currentTrack.image)
      .then(({ accent: color }) => {
        if (active) setAccent(color);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [currentTrack.image]);

  return (
    <section className="artist-album-cluster" aria-label="Músicas recomendadas">
      <div className="artist-album-cluster__field">
        <button
          className={`cluster-current${isPlaying ? 'is-playing' : ''}`}
          style={{ '--track-accent': accent } as CSSProperties}
          onClick={onTogglePlayback}
          aria-label={`${currentTrack.title}, de ${currentTrack.artist}. Alternar reprodução`}
        >
          <span className="cluster-current__ring" aria-hidden="true" />
          <span className="cluster-current__cover">
            <span
              key={currentTrack.id}
              className="cluster-current__artwork"
              style={{ backgroundImage: `url("${currentTrack.image}")` }}
            />
          </span>
          <span className="cluster-current__play">
            <Icon name={isPlaying ? 'pause' : 'play_arrow'} />
          </span>
          <span className="cluster-current__caption">
            <strong>{currentTrack.title}</strong>
            <small>{currentTrack.artist}</small>
          </span>
        </button>
        {items.slice(0, positions.length).map((item, index) => {
          const [x, y] = positions[index];
          const size = sizeFor(item.listeners);

          return (
            <ClusterNode
              key={item.id}
              item={item}
              x={x}
              y={y}
              size={size}
              delay={index * 65}
              onSelectTrack={onSelectTrack}
              onOpenAlbum={onOpenAlbum}
            />
          );
        })}
      </div>
    </section>
  );
}
