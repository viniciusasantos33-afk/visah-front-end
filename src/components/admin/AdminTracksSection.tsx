import { useEffect, useState, type FormEvent } from 'react';
import type { ApiArtist, Genre, Mood, Track } from '../../types/catalog';
import { formatDuration } from '../../types/catalog';
import { readAudioDuration } from '../../utils/audio';
import { Icon } from '../Icon';

export type TrackFormValues = {
  editing: Track | null;
  title: string;
  artistId: string;
  genreId: string;
  moodId: string;
  audioFile: File | null;
  audioDuration: number | null;
  coverFile: File | null;
  coverUrl: string;
};

type AdminTracksSectionProps = {
  tracks: Track[];
  artists: ApiArtist[];
  genres: Genre[];
  moods: Mood[];
  busy: boolean;
  onSave: (values: TrackFormValues) => Promise<boolean>;
  onAudioError: (message: string) => void;
  onDelete: (track: Track) => void;
};

export function AdminTracksSection({
  tracks,
  artists,
  genres,
  moods,
  busy,
  onSave,
  onAudioError,
  onDelete,
}: AdminTracksSectionProps) {
  const [editing, setEditing] = useState<Track | null>(null);
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [genreId, setGenreId] = useState('');
  const [moodId, setMoodId] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [readingAudio, setReadingAudio] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState('');

  useEffect(() => {
    setArtistId((current) => current || String(artists[0]?.id ?? ''));
    setGenreId((current) => current || String(genres[0]?.id ?? ''));
    setMoodId((current) => current || String(moods[0]?.id ?? ''));
  }, [artists, genres, moods]);

  const reset = () => {
    setEditing(null);
    setTitle('');
    setArtistId(String(artists[0]?.id ?? ''));
    setGenreId(String(genres[0]?.id ?? ''));
    setMoodId(String(moods[0]?.id ?? ''));
    setAudioFile(null);
    setAudioDuration(null);
    setCoverFile(null);
    setCoverUrl('');
  };

  const beginEdit = (track: Track) => {
    setEditing(track);
    setTitle(track.title);
    setArtistId(String(track.artistId));
    setGenreId(String(track.genreId));
    setMoodId(String(track.moodId));
    setAudioFile(null);
    setAudioDuration(track.durationSeconds);
    setCoverFile(null);
    setCoverUrl(track.coverUrl ?? '');
  };

  const selectAudio = async (file: File | null) => {
    setAudioFile(file);
    setAudioDuration(null);
    if (!file) return;
    onAudioError('');
    setReadingAudio(true);
    try {
      setAudioDuration(await readAudioDuration(file));
    } catch (error) {
      setAudioFile(null);
      onAudioError(
        error instanceof Error ? error.message : 'Não foi possível ler o áudio.'
      );
    } finally {
      setReadingAudio(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave({
      editing,
      title,
      artistId,
      genreId,
      moodId,
      audioFile,
      audioDuration,
      coverFile,
      coverUrl,
    }).then((saved) => {
      if (saved) reset();
    });
  };

  return (
    <>
      <form className="admin-form admin-form--compact" onSubmit={submit}>
        <div className="admin-form__heading">
          <h3>{editing ? 'Editar música' : 'Adicionar música'}</h3>
          <p>Selecione o áudio para obter a duração automaticamente.</p>
        </div>
        <label>
          <span>Título</span>
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome da música"
          />
        </label>
        <div className="admin-form__row">
          <label>
            <span>Artista</span>
            <select
              required
              value={artistId}
              onChange={(event) => setArtistId(event.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {artists.map((artist) => (
                <option value={artist.id} key={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Gênero</span>
            <select
              required
              value={genreId}
              onChange={(event) => setGenreId(event.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {genres.map((genre) => (
                <option value={genre.id} key={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Mood</span>
            <select
              required
              value={moodId}
              onChange={(event) => setMoodId(event.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {moods.map((mood) => (
                <option value={mood.id} key={mood.id}>
                  {mood.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span>
            Arquivo de áudio{' '}
            {editing && <small>selecione para substituir</small>}
          </span>
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
            required={!editing}
            onChange={(event) =>
              void selectAudio(event.target.files?.[0] ?? null)
            }
          />
          {readingAudio ? (
            <small className="admin-audio-duration">Lendo duração…</small>
          ) : audioDuration ? (
            <small className="admin-audio-duration">
              <Icon name="schedule" /> Duração detectada:{' '}
              {formatDuration(audioDuration)}
            </small>
          ) : (
            editing && (
              <small className="admin-audio-duration">
                Duração atual: {formatDuration(editing.durationSeconds)}
              </small>
            )
          )}
        </label>
        <label>
          <span>
            Capa <small>opcional</small>
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
          />
          {!coverFile && (
            <input
              type="url"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              placeholder="URL HTTPS da capa"
            />
          )}
        </label>
        <div className="admin-form__actions">
          <button
            className="admin-submit"
            type="submit"
            disabled={
              busy ||
              readingAudio ||
              !artists.length ||
              !genres.length ||
              !moods.length
            }
          >
            {busy
              ? 'Salvando…'
              : editing
                ? 'Salvar música'
                : 'Adicionar música'}
            <Icon name="arrow_forward" />
          </button>
          {editing && (
            <button type="button" className="admin-cancel" onClick={reset}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <div className="admin-manage-list">
        {tracks.map((track) => (
          <div className="admin-manage-row" key={track.id}>
            <img className="admin-manage-avatar" src={track.image} alt="" />
            <span>
              <strong>{track.title}</strong>
              <small>
                {track.artist} · {formatDuration(track.durationSeconds)} ·{' '}
                {track.audioUrl ? 'áudio pronto' : 'sem áudio'}
              </small>
            </span>
            <div className="admin-row-actions">
              <button
                type="button"
                aria-label={`Editar ${track.title}`}
                onClick={() => beginEdit(track)}
              >
                <Icon name="edit" />
              </button>
              <button
                type="button"
                className="is-danger"
                aria-label={`Remover ${track.title}`}
                onClick={() => onDelete(track)}
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>
        ))}
        {!tracks.length && (
          <p className="admin-list-empty">Ainda não há músicas cadastradas.</p>
        )}
      </div>
    </>
  );
}
