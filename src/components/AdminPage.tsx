import { useEffect, useState } from 'react';
import {
  createArtist,
  createGenre,
  createMood,
  createTrack,
  deactivateAdminUser,
  deleteAlbum,
  deleteArtist,
  deleteGenre,
  deleteMood,
  deleteTrack,
  updateAdminUser,
  updateArtist,
  updateGenre,
  updateMood,
  updateTrack,
  uploadArtistPhoto,
  uploadTrackAudio,
  uploadTrackCover,
} from '../services/adminApi';
import { useAdminData } from '../hooks/useAdminData';
import { useAlbumAdmin } from '../hooks/useAlbumAdmin';
import type { ApiArtist, Track } from '../types/catalog';
import { Icon } from './Icon';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminWorkspace } from './admin/AdminWorkspace';
import { AdminTaxonomySection } from './admin/AdminTaxonomySection';
import { AdminArtistsSection } from './admin/AdminArtistsSection';
import { AdminUsersSection } from './admin/AdminUsersSection';
import { AdminTracksSection } from './admin/AdminTracksSection';
import { AdminAlbumsSection } from './admin/AdminAlbumsSection';
import type { AdminSection, AdminSectionItem } from './admin/types';
import type { TrackFormValues } from './admin/AdminTracksSection';

type AdminPageProps = {
  tracks: Track[];
  currentUserId: number;
  onCreated: () => Promise<void>;
};
const sections: AdminSectionItem[] = [
  { id: 'tracks', label: 'Músicas', icon: 'library_music' },
  { id: 'albums', label: 'Álbuns', icon: 'album' },
  { id: 'artists', label: 'Artistas', icon: 'person' },
  { id: 'genres', label: 'Gêneros', icon: 'category' },
  { id: 'moods', label: 'Moods', icon: 'flare' },
  { id: 'users', label: 'Perfis', icon: 'manage_accounts' },
];

export function AdminPage({
  tracks,
  currentUserId,
  onCreated,
}: AdminPageProps) {
  const [section, setSection] = useState<AdminSection>('tracks');
  const {
    artists,
    albums,
    genres,
    moods,
    users,
    busy,
    message,
    error,
    setError,
    setMessage,
    loadData,
    perform,
  } = useAdminData(onCreated);

  const albumAdmin = useAlbumAdmin(artists, genres, moods, perform, setError);

  useEffect(() => {
    loadData().catch((loadError) =>
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar os dados administrativos.'
      )
    );
  }, [loadData]);

  const cancelEdit = () => {
    albumAdmin.cancel();
  };

  const saveArtist = (
    artistId: number | null,
    payload: Pick<ApiArtist, 'name' | 'biography' | 'photoUrl'>,
    photoFile: File | null
  ) => {
    return perform(
      async () => {
        let savedId: number;
        if (artistId != null) {
          await updateArtist(artistId, payload);
          savedId = artistId;
        } else {
          savedId = (await createArtist(payload)).id;
        }
        if (photoFile) await uploadArtistPhoto(savedId, photoFile);
      },
      artistId != null ? 'Artista atualizado.' : 'Artista adicionado.'
    );
  };

  const saveTaxonomy = (
    kind: 'genres' | 'moods',
    id: number | null,
    name: string
  ) => {
    return perform(
      async () => {
        if (kind === 'genres') {
          if (id != null) await updateGenre(id, name);
          else await createGenre(name);
        } else if (id != null) await updateMood(id, name);
        else await createMood(name);
      },
      id != null
        ? 'Alterações salvas.'
        : `${kind === 'genres' ? 'Gênero' : 'Mood'} adicionado.`
    );
  };

  const saveTrack = (values: TrackFormValues): Promise<boolean> => {
    if (!values.editing && !values.audioFile) {
      setError(
        'Selecione o arquivo de áudio; a duração será lida automaticamente dele.'
      );
      return Promise.resolve(false);
    }
    const durationSeconds =
      values.audioDuration ?? values.editing?.durationSeconds ?? 0;
    if (!durationSeconds) {
      setError(
        'Não foi possível determinar a duração. Selecione novamente um arquivo de áudio.'
      );
      return Promise.resolve(false);
    }
    const payload = {
      title: values.title.trim(),
      artistId: Number(values.artistId),
      albumId: values.editing?.albumId ?? null,
      genreId: Number(values.genreId),
      moodId: Number(values.moodId),
      durationSeconds,
      audioUrl: values.editing?.audioUrl ?? null,
      coverUrl: values.coverFile
        ? (values.editing?.coverUrl ?? null)
        : values.coverUrl.trim() || null,
    };
    return perform(
      async () => {
        const id = values.editing?.id;
        if (id) await updateTrack(id, payload);
        else {
          const created = await createTrack(payload);
          if (values.audioFile)
            await uploadTrackAudio(created.id, values.audioFile);
          if (values.coverFile)
            await uploadTrackCover(created.id, values.coverFile);
        }
        if (id && values.audioFile)
          await uploadTrackAudio(id, values.audioFile);
        if (id && values.coverFile)
          await uploadTrackCover(id, values.coverFile);
      },
      values.editing ? 'Música atualizada.' : 'Música adicionada ao catálogo.'
    );
  };

  const deleteEntity = (label: string, action: () => Promise<void>) => {
    if (!window.confirm(`Deseja realmente remover ${label}?`)) return;
    void perform(action, `${label} removido(a).`);
  };

  return (
    <section className="admin-page" aria-label="Administração da plataforma">
      <div className="admin-page__content">
        <header className="admin-page__intro">
          <span className="admin-page__eyebrow">
            <Icon name="admin_panel_settings" /> Administração
          </span>
          <h1>Gestão da plataforma.</h1>
          <p>
            Gerencie o catálogo, os filtros musicais e os acessos dos perfis.
          </p>
        </header>

        <div className="admin-dashboard">
          <AdminSidebar
            active={section}
            sections={sections}
            counts={{
              tracks: tracks.length,
              albums: albums.length,
              artists: artists.length,
              genres: genres.length,
              moods: moods.length,
              users: users.length,
            }}
            onSelect={(nextSection) => {
              cancelEdit();
              setSection(nextSection);
              setError('');
              setMessage('');
            }}
          />

          <AdminWorkspace
            section={sections.find((item) => item.id === section)}
          >
            {section === 'albums' && (
              <AdminAlbumsSection
                albums={albums}
                artists={artists}
                genres={genres}
                moods={moods}
                editing={albumAdmin.editing}
                title={albumAdmin.title}
                artistId={albumAdmin.artistId}
                releaseDate={albumAdmin.releaseDate}
                coverFile={albumAdmin.coverFile}
                coverUrl={albumAdmin.coverUrl}
                createArtistInline={albumAdmin.createArtistInline}
                inlineArtistName={albumAdmin.inlineArtistName}
                inlineArtistBiography={albumAdmin.inlineArtistBiography}
                inlineArtistPhotoFile={albumAdmin.inlineArtistPhotoFile}
                drafts={albumAdmin.drafts}
                busy={busy}
                onSubmit={albumAdmin.submit}
                onTitleChange={albumAdmin.setTitle}
                onArtistChange={albumAdmin.setArtistId}
                onReleaseDateChange={albumAdmin.setReleaseDate}
                onCoverFileChange={albumAdmin.setCoverFile}
                onCoverUrlChange={albumAdmin.setCoverUrl}
                onCreateArtistInlineChange={albumAdmin.setCreateArtistInline}
                onInlineArtistNameChange={albumAdmin.setInlineArtistName}
                onInlineArtistBiographyChange={
                  albumAdmin.setInlineArtistBiography
                }
                onInlineArtistPhotoChange={albumAdmin.setInlineArtistPhotoFile}
                onDraftChange={albumAdmin.updateDraft}
                onDraftRemove={albumAdmin.removeDraft}
                onDraftAudioChange={(key, file) =>
                  void albumAdmin.setDraftAudio(key, file)
                }
                onAddDraft={albumAdmin.addDraft}
                onCancel={albumAdmin.cancel}
                onEdit={(album) => {
                  albumAdmin.beginEdit(album);
                  setSection('albums');
                  setError('');
                }}
                onDelete={(album) =>
                  deleteEntity(
                    `o álbum ${album.title}; as faixas serão mantidas como singles`,
                    () => deleteAlbum(album.id)
                  )
                }
              />
            )}

            {section === 'artists' && (
              <AdminArtistsSection
                artists={artists}
                busy={busy}
                onSave={saveArtist}
                onDelete={(artist) =>
                  deleteEntity(artist.name, () => deleteArtist(artist.id))
                }
              />
            )}

            {(section === 'genres' || section === 'moods') && (
              <AdminTaxonomySection
                kind={section}
                items={section === 'genres' ? genres : moods}
                busy={busy}
                onSave={saveTaxonomy}
                onDelete={(item) =>
                  deleteEntity(item.name, () =>
                    section === 'genres'
                      ? deleteGenre(item.id)
                      : deleteMood(item.id)
                  )
                }
              />
            )}

            {section === 'tracks' && (
              <AdminTracksSection
                tracks={tracks}
                artists={artists}
                genres={genres}
                moods={moods}
                busy={busy}
                onSave={saveTrack}
                onAudioError={setError}
                onDelete={(track) =>
                  deleteEntity(track.title, () => deleteTrack(track.id))
                }
              />
            )}

            {section === 'users' && (
              <AdminUsersSection
                users={users}
                currentUserId={currentUserId}
                busy={busy}
                onSave={(id, changes) =>
                  perform(
                    () => updateAdminUser(id, changes),
                    'Perfil atualizado.'
                  )
                }
                onDeactivate={(account) =>
                  deleteEntity(`o perfil de ${account.name}`, () =>
                    deactivateAdminUser(account.id)
                  )
                }
              />
            )}

            {error && (
              <p className="admin-feedback admin-feedback--error" role="alert">
                <Icon name="error" />
                {error}
              </p>
            )}
            {message && (
              <p className="admin-feedback" role="status">
                <Icon name="check_circle" />
                {message}
              </p>
            )}
          </AdminWorkspace>
        </div>
      </div>
    </section>
  );
}
