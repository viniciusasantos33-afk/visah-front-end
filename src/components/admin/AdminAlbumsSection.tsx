import type { FormEvent } from 'react';
import type { ApiAlbum, ApiArtist, Genre, Mood } from '../../types/catalog';
import { formatDuration } from '../../types/catalog';
import { Icon } from '../Icon';
import type { AlbumDraftTrack } from './types';

type AdminAlbumsSectionProps = {
  albums: ApiAlbum[];
  artists: ApiArtist[];
  genres: Genre[];
  moods: Mood[];
  editing: ApiAlbum | null;
  title: string;
  artistId: string;
  releaseDate: string;
  coverFile: File | null;
  coverUrl: string;
  createArtistInline: boolean;
  inlineArtistName: string;
  inlineArtistBiography: string;
  inlineArtistPhotoFile: File | null;
  drafts: AlbumDraftTrack[];
  busy: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
  onReleaseDateChange: (value: string) => void;
  onCoverFileChange: (file: File | null) => void;
  onCoverUrlChange: (value: string) => void;
  onCreateArtistInlineChange: (value: boolean) => void;
  onInlineArtistNameChange: (value: string) => void;
  onInlineArtistBiographyChange: (value: string) => void;
  onInlineArtistPhotoChange: (file: File | null) => void;
  onDraftChange: (key: number, updates: Partial<AlbumDraftTrack>) => void;
  onDraftRemove: (key: number) => void;
  onDraftAudioChange: (key: number, file: File | null) => void;
  onAddDraft: () => void;
  onCancel: () => void;
  onEdit: (album: ApiAlbum) => void;
  onDelete: (album: ApiAlbum) => void;
};

export function AdminAlbumsSection({
  albums,
  artists,
  genres,
  moods,
  editing,
  title,
  artistId,
  releaseDate,
  coverFile,
  coverUrl,
  createArtistInline,
  inlineArtistName,
  inlineArtistBiography,
  inlineArtistPhotoFile,
  drafts,
  busy,
  onSubmit,
  onTitleChange,
  onArtistChange,
  onReleaseDateChange,
  onCoverFileChange,
  onCoverUrlChange,
  onCreateArtistInlineChange,
  onInlineArtistNameChange,
  onInlineArtistBiographyChange,
  onInlineArtistPhotoChange,
  onDraftChange,
  onDraftRemove,
  onDraftAudioChange,
  onAddDraft,
  onCancel,
  onEdit,
  onDelete,
}: AdminAlbumsSectionProps) {
  return (
    <>
      <form className="admin-form admin-form--compact" onSubmit={onSubmit}>
        <div className="admin-form__heading">
          <h3>{editing ? 'Editar álbum' : 'Novo álbum e suas músicas'}</h3>
          <p>Cadastre uma vez a capa e inclua várias faixas no mesmo envio.</p>
        </div>
        {!editing && (
          <label className="admin-inline-toggle">
            <input
              type="checkbox"
              checked={createArtistInline}
              onChange={(event) =>
                onCreateArtistInlineChange(event.target.checked)
              }
            />
            Criar artista junto com o álbum
          </label>
        )}
        {createArtistInline && !editing ? (
          <div className="admin-inline-artist">
            <label>
              <span>Nome do artista</span>
              <input
                required
                maxLength={120}
                value={inlineArtistName}
                onChange={(event) =>
                  onInlineArtistNameChange(event.target.value)
                }
                placeholder="Nome do artista"
              />
            </label>
            <label>
              <span>
                Biografia <small>opcional</small>
              </span>
              <textarea
                rows={2}
                maxLength={2000}
                value={inlineArtistBiography}
                onChange={(event) =>
                  onInlineArtistBiographyChange(event.target.value)
                }
                placeholder="Biografia do artista"
              />
            </label>
            <label>
              <span>
                Foto do artista <small>opcional · até 10 MB</small>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) =>
                  onInlineArtistPhotoChange(event.target.files?.[0] ?? null)
                }
              />
              {inlineArtistPhotoFile && (
                <small className="admin-file-picked">
                  <Icon name="image" />
                  {inlineArtistPhotoFile.name}
                </small>
              )}
            </label>
          </div>
        ) : (
          <label>
            <span>Artista</span>
            <select
              required
              value={artistId}
              onChange={(event) => onArtistChange(event.target.value)}
            >
              <option value="" disabled>
                Selecione o artista
              </option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="admin-form__row">
          <label>
            <span>Nome do álbum</span>
            <input
              required
              maxLength={160}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Nome do álbum"
            />
          </label>
          <label>
            <span>
              Data de lançamento <small>opcional</small>
            </span>
            <input
              type="date"
              value={releaseDate}
              onChange={(event) => onReleaseDateChange(event.target.value)}
            />
          </label>
        </div>
        <label>
          <span>Capa do álbum</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              onCoverFileChange(event.target.files?.[0] ?? null)
            }
          />
          {!coverFile && (
            <input
              type="url"
              value={coverUrl}
              onChange={(event) => onCoverUrlChange(event.target.value)}
              placeholder="URL HTTPS da capa"
            />
          )}
        </label>
        {!editing && (
          <div className="album-draft-list">
            <div className="album-draft-list__heading">
              <span>Faixas do álbum</span>
              <small>
                {drafts.length} {drafts.length === 1 ? 'música' : 'músicas'}
              </small>
            </div>
            {drafts.map((draft, index) => (
              <article className="album-draft" key={draft.key}>
                <header>
                  <strong>Faixa {String(index + 1).padStart(2, '0')}</strong>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remover faixa ${index + 1}`}
                      onClick={() => onDraftRemove(draft.key)}
                    >
                      <Icon name="close" />
                    </button>
                  )}
                </header>
                <label>
                  <span>Título da música</span>
                  <input
                    required
                    maxLength={160}
                    value={draft.title}
                    onChange={(event) =>
                      onDraftChange(draft.key, { title: event.target.value })
                    }
                    placeholder="Título da faixa"
                  />
                </label>
                <div className="admin-form__row">
                  <label>
                    <span>Gênero</span>
                    <select
                      required
                      value={draft.genreId}
                      onChange={(event) =>
                        onDraftChange(draft.key, {
                          genreId: event.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {genres.map((genre) => (
                        <option key={genre.id} value={genre.id}>
                          {genre.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Mood</span>
                    <select
                      required
                      value={draft.moodId}
                      onChange={(event) =>
                        onDraftChange(draft.key, { moodId: event.target.value })
                      }
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {moods.map((mood) => (
                        <option key={mood.id} value={mood.id}>
                          {mood.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  <span>Arquivo de áudio</span>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
                    required
                    onChange={(event) =>
                      onDraftAudioChange(
                        draft.key,
                        event.target.files?.[0] ?? null
                      )
                    }
                  />
                  {draft.reading ? (
                    <small className="admin-audio-duration">
                      Lendo duração…
                    </small>
                  ) : draft.duration ? (
                    <small className="admin-audio-duration">
                      <Icon name="schedule" /> {formatDuration(draft.duration)}
                    </small>
                  ) : null}
                </label>
              </article>
            ))}
            <button
              className="album-add-track"
              type="button"
              onClick={onAddDraft}
              disabled={!genres.length || !moods.length}
            >
              <Icon name="add" />
              Adicionar outra faixa
            </button>
          </div>
        )}
        <div className="admin-form__actions">
          <button
            className="admin-submit"
            type="submit"
            disabled={busy || drafts.some((draft) => draft.reading)}
          >
            {busy
              ? 'Salvando álbum…'
              : editing
                ? 'Salvar álbum'
                : 'Criar álbum e faixas'}
            <Icon name="arrow_forward" />
          </button>
          {editing && (
            <button type="button" className="admin-cancel" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <div className="admin-manage-list">
        {albums.map((album) => (
          <div className="admin-manage-row" key={album.id}>
            <img
              className="admin-manage-avatar"
              src={album.coverUrl || '/profile-placeholder.svg'}
              alt=""
            />
            <span>
              <strong>{album.title}</strong>
              <small>
                {album.artist?.name ??
                  artists.find((artist) => artist.id === album.artistId)
                    ?.name ??
                  'Artista'}{' '}
                · {album.releaseDate?.slice(0, 10) ?? 'Sem data'}
              </small>
            </span>
            <div className="admin-row-actions">
              <button
                type="button"
                aria-label={`Editar ${album.title}`}
                onClick={() => onEdit(album)}
              >
                <Icon name="edit" />
              </button>
              <button
                type="button"
                className="is-danger"
                aria-label={`Remover ${album.title}`}
                onClick={() => onDelete(album)}
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>
        ))}
        {!albums.length && (
          <p className="admin-list-empty">Ainda não há álbuns cadastrados.</p>
        )}
      </div>
    </>
  );
}
