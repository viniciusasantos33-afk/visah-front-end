import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { extractImagePalette } from '../utils/imagePalette';
import type { Artist, Track } from '../types/catalog';
import { Icon } from './Icon';
import { ArtistDetail } from './ArtistDetail';

type ArtistDirectoryProps = {
  artists: Artist[];
  tracks: Track[];
  moods: string[];
  selectedMood: string;
  onSelectMood: (mood: string) => void;
  onSelectSong: (track: Track) => void;
};

function shuffleArtists(items: Artist[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function diversifyMoodTracks(
  items: Track[],
  selectedMood: string,
  moods: string[]
) {
  const moodIndex = Math.max(0, moods.indexOf(selectedMood));
  const distance = (track: Track) => {
    const index = Math.max(0, moods.indexOf(track.mood));
    return Math.min(
      Math.abs(index - moodIndex),
      moods.length - Math.abs(index - moodIndex)
    );
  };
  const remaining = [...items].sort(
    (a, b) =>
      Number(b.mood === selectedMood) - Number(a.mood === selectedMood) ||
      distance(a) - distance(b) ||
      b.listeners - a.listeners
  );
  const ordered: Track[] = [];
  while (remaining.length) {
    const previous = ordered.at(-1);
    let choices = previous
      ? remaining.filter(
          (track) =>
            previous.albumId == null || track.albumId !== previous.albumId
        )
      : remaining;
    if (!choices.length) choices = remaining;
    if (previous) {
      const differentArtist = choices.filter(
        (track) => track.artistId !== previous.artistId
      );
      if (differentArtist.length) choices = differentArtist;
    }
    const pickWindow = choices.slice(0, Math.min(8, choices.length));
    const selectedIndex = Math.floor(Math.random() * pickWindow.length);
    const [selected] = pickWindow.splice(selectedIndex, 1);
    ordered.push(selected);
    remaining.splice(
      remaining.findIndex((track) => track.id === selected.id),
      1
    );
  }
  return ordered;
}

function readableTextColor(color: string) {
  const channels = color.match(/\d+/g)?.map(Number) ?? [182, 163, 137];
  const luminance =
    (0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]) / 255;
  return luminance > 0.62 ? '#161616' : '#ffffff';
}

function MoodTrackCard({
  track,
  onSelect,
  index,
}: {
  track: Track;
  onSelect: () => void;
  index: number;
}) {
  const [accent, setAccent] = useState('#b6a389');
  const [textColor, setTextColor] = useState('#161616');

  useEffect(() => {
    let active = true;
    extractImagePalette(track.image)
      .then(({ accent: color }) => {
        if (!active) return;
        setAccent(color);
        setTextColor(readableTextColor(color));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [track.image]);

  return (
    <article className="mood-track-card-wrap">
      <button
        type="button"
        className="mood-track-card"
        style={{
          backgroundImage: `url("${track.image}")`,
          animationDelay: `${Math.min(index, 12) * 28}ms`,
        }}
        aria-label={`Reproduzir ${track.title}, de ${track.artist}`}
        onClick={onSelect}
      />
      <span
        className="mood-track-card-name"
        style={{ backgroundColor: accent, color: textColor }}
        title={track.title}
      >
        {track.title}
      </span>
    </article>
  );
}

function ArtistCard({
  artist,
  onSelect,
}: {
  artist: Artist;
  onSelect: () => void;
}) {
  const [accent, setAccent] = useState('#b6a389');
  const [textColor, setTextColor] = useState('#161616');

  useEffect(() => {
    let active = true;
    extractImagePalette(artist.image)
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
  }, [artist.image]);

  return (
    <article className="artist-card">
      <button
        className="artist-card__portrait"
        style={{ backgroundImage: `url("${artist.image}")` }}
        onClick={onSelect}
        aria-label={`Explorar ${artist.name}`}
      />
      <span
        className="artist-card__name"
        style={{ backgroundColor: accent, color: textColor }}
      >
        {artist.name}
      </span>
    </article>
  );
}

export function ArtistDirectory({
  artists,
  tracks,
  moods,
  selectedMood,
  onSelectMood,
  onSelectSong,
}: ArtistDirectoryProps) {
  const [view, setView] = useState<'artists' | 'moods'>('artists');
  const [artistOrder, setArtistOrder] = useState<Artist[]>(() =>
    shuffleArtists(artists)
  );
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [moodHasScrolled, setMoodHasScrolled] = useState(false);
  const [moodTrackIds, setMoodTrackIds] = useState<number[]>([]);
  const tracksRef = useRef(tracks);
  const moodsRef = useRef(moods);
  tracksRef.current = tracks;
  moodsRef.current = moods;
  useEffect(() => {
    setArtistOrder((current) => {
      const available = new Map(artists.map((artist) => [artist.id, artist]));
      const currentIds = new Set(current.map((artist) => artist.id));
      const existing = current
        .filter((artist) => available.has(artist.id))
        .map((artist) => available.get(artist.id)!);
      const added = shuffleArtists(
        artists.filter((artist) => !currentIds.has(artist.id))
      );
      return current.length ? [...existing, ...added] : shuffleArtists(artists);
    });
  }, [artists]);
  const selectedMoodIndex = Math.max(0, moods.indexOf(selectedMood));
  const moodTrackKey = tracks
    .map(
      (track) =>
        `${track.id}:${track.albumId}:${track.artistId}:${track.moodId}`
    )
    .join('|');
  const moodListKey = moods.join('|');
  useEffect(() => {
    if (view !== 'moods') return;
    setMoodTrackIds(
      diversifyMoodTracks(
        tracksRef.current,
        selectedMood,
        moodsRef.current
      ).map((track) => track.id)
    );
  }, [view, selectedMood, moodTrackKey, moodListKey]);
  const wheelItems = Array.from({ length: 3 }, (_, cycle) =>
    moods.map((mood, index) => ({ mood, index: cycle * moods.length + index }))
  ).flat();
  const selectedWheelIndex = moods.length + selectedMoodIndex;
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  const moodTracks = moodTrackIds.flatMap((id) => {
    const track = tracksById.get(id);
    return track ? [track] : [];
  });
  return (
    <section
      className="artist-directory"
      aria-label="Explorar artistas e moods"
    >
      <div className="artist-directory__content">
        <div
          className="directory-switch"
          role="tablist"
          aria-label="Tipo de exploração"
        >
          <button
            className={
              view === 'artists'
                ? 'directory-switch__option active'
                : 'directory-switch__option'
            }
            role="tab"
            aria-selected={view === 'artists'}
            onClick={() => {
              setView('artists');
              setMoodHasScrolled(false);
              setSelectedArtist(null);
            }}
          >
            <Icon name="account_circle" /> Artista
          </button>
          <button
            className={
              view === 'moods'
                ? 'directory-switch__option active'
                : 'directory-switch__option'
            }
            role="tab"
            aria-selected={view === 'moods'}
            onClick={() => {
              setView('moods');
              setMoodHasScrolled(false);
              setSelectedArtist(null);
            }}
          >
            <Icon name="flare" /> Mood
          </button>
        </div>

        {view === 'artists' && selectedArtist ? (
          <ArtistDetail artist={selectedArtist} onSelectSong={onSelectSong} />
        ) : view === 'artists' ? (
          <div className="artist-directory__grid" role="tabpanel">
            {artistOrder.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onSelect={() => setSelectedArtist(artist)}
              />
            ))}
          </div>
        ) : (
          <>
            <div
              className={`mood-roulette-glass${moodHasScrolled ? 'mood-roulette-glass--scrolled' : ''}`}
              aria-hidden="true"
            />
            <div className="mood-explorer-prompt" aria-label="Escolha um mood">
              <p>Quero algo mais</p>
              <div className="mood-wheel-window">
                <div
                  className="mood-wheel-track"
                  style={
                    {
                      '--wheel-offset': `${56 - selectedWheelIndex * 28}px`,
                    } as CSSProperties
                  }
                >
                  {wheelItems.map(({ mood, index }) => {
                    const distance = Math.abs(index - selectedWheelIndex);
                    return (
                      <button
                        key={`${mood}-${index}`}
                        className={
                          index === selectedWheelIndex
                            ? 'mood-wheel-item selected'
                            : 'mood-wheel-item'
                        }
                        style={{
                          opacity: Math.max(
                            0.12,
                            1 - Math.min(distance, 4) * 0.22
                          ),
                        }}
                        aria-pressed={index === selectedWheelIndex}
                        onClick={() => onSelectMood(mood)}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div
              className="mood-track-grid"
              role="tabpanel"
              aria-label={`Músicas para o mood ${selectedMood}`}
              onScroll={(event) =>
                setMoodHasScrolled(event.currentTarget.scrollTop > 2)
              }
            >
              {moodTracks.map((track, trackIndex) => (
                <MoodTrackCard
                  key={`${track.id}-${selectedMood}`}
                  track={track}
                  index={trackIndex}
                  onSelect={() => onSelectSong(track)}
                />
              ))}
              {!moodTracks.length && (
                <p className="catalog-empty">
                  Nenhuma música disponível para este mood.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
