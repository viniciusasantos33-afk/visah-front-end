import type { Artist, Track } from '../types/catalog';
import { Icon } from './Icon';

type ArtistDetailProps = {
  artist: Artist;
  onSelectSong: (track: Track) => void;
};

export function ArtistDetail({ artist, onSelectSong }: ArtistDetailProps) {
  const albumSections = [
    ...[...artist.albums]
      .sort(
        (a, b) =>
          (Date.parse(b.releaseDate ?? '') || 0) -
          (Date.parse(a.releaseDate ?? '') || 0)
      )
      .map((album) => ({
        title: album.title,
        cover: album.cover,
        date: album.releaseDate,
        tracks: album.tracks,
      })),
    ...(artist.tracks.length
      ? [
          {
            title: 'Singles',
            cover: artist.image,
            date: null,
            tracks: artist.tracks,
          },
        ]
      : []),
  ];

  return (
    <section
      className="artist-detail"
      aria-label={`Discografia de ${artist.name}`}
    >
      <header className="artist-detail__profile">
        <img src={artist.image} alt="" />
        <div className="artist-detail__identity">
          <h1>{artist.name}</h1>
          <span className="artist-detail__listeners">
            <Icon name="headphones" />
            {artist.listeners.toLocaleString('pt-BR')} reproduções
          </span>
          {artist.biography && (
            <p className="artist-detail__biography">{artist.biography}</p>
          )}
        </div>
      </header>

      {albumSections.length ? (
        <div className="artist-detail__albums">
          {albumSections.map((album) => (
            <article className="artist-album-row" key={album.title}>
              <img
                className="artist-album-row__cover"
                src={album.cover}
                alt={`Capa do álbum ${album.title}`}
              />
              <div className="artist-album-row__content">
                <h2>
                  {album.title}
                  {album.date && <span> · {album.date.slice(0, 4)}</span>}
                </h2>
                <ol className="artist-album-row__tracks">
                  {album.tracks.map((track) => (
                    <li key={track.id}>
                      <button
                        className="artist-album-track"
                        title={`${track.title} · ${track.duration}`}
                        aria-label={`Reproduzir ${track.title}, ${track.duration}`}
                        onClick={() => onSelectSong(track)}
                      >
                        <span>{track.title}</span>
                        <Icon name="arrow_forward" />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="artist-detail__empty">
          Ainda não há músicas cadastradas para {artist.name}.
        </div>
      )}
    </section>
  );
}
