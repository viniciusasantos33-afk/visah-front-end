import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ApiAlbum, Genre, Mood } from '../types/catalog';
import {
  createAlbum,
  createArtist,
  createTrack,
  updateAlbum,
  uploadAlbumCover,
  uploadArtistPhoto,
  uploadTrackAudio,
} from '../services/adminApi';
import type { ApiArtist } from '../types/catalog';
import { useAlbumDrafts } from './useAlbumDrafts';

type Perform = (
  action: () => Promise<void>,
  success: string
) => Promise<boolean>;

export function useAlbumAdmin(
  artists: ApiArtist[],
  genres: Genre[],
  moods: Mood[],
  perform: Perform,
  onError: (message: string) => void
) {
  const [editing, setEditing] = useState<ApiAlbum | null>(null);
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [createArtistInline, setCreateArtistInline] = useState(false);
  const [inlineArtistName, setInlineArtistName] = useState('');
  const [inlineArtistBiography, setInlineArtistBiography] = useState('');
  const [inlineArtistPhotoFile, setInlineArtistPhotoFile] =
    useState<File | null>(null);
  const {
    drafts,
    setDrafts,
    updateDraft,
    addDraft,
    removeDraft,
    resetDrafts,
    setDraftAudio,
  } = useAlbumDrafts(genres, moods, onError);

  useEffect(() => {
    setArtistId((current) => current || String(artists[0]?.id ?? ''));
    setDrafts((current) =>
      current.map((draft) => ({
        ...draft,
        genreId: draft.genreId || String(genres[0]?.id ?? ''),
        moodId: draft.moodId || String(moods[0]?.id ?? ''),
      }))
    );
  }, [artists, genres, moods, setDrafts]);

  const cancel = useCallback(() => {
    setEditing(null);
    setTitle('');
    setArtistId(String(artists[0]?.id ?? ''));
    setReleaseDate('');
    setCoverFile(null);
    setCoverUrl('');
    setCreateArtistInline(false);
    setInlineArtistName('');
    setInlineArtistBiography('');
    setInlineArtistPhotoFile(null);
    resetDrafts();
  }, [artists, resetDrafts]);

  const beginEdit = useCallback(
    (album: ApiAlbum) => {
      setEditing(album);
      setTitle(album.title);
      setArtistId(String(album.artistId));
      setReleaseDate(album.releaseDate?.slice(0, 10) ?? '');
      setCoverFile(null);
      setCoverUrl(album.coverUrl ?? '');
      setDrafts([]);
      setCreateArtistInline(false);
    },
    [setDrafts]
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing && drafts.length === 0) {
      onError('Adicione pelo menos uma música para criar este álbum.');
      return;
    }
    if (
      !editing &&
      drafts.some(
        (draft) =>
          !draft.title.trim() ||
          !draft.genreId ||
          !draft.moodId ||
          !draft.file ||
          !draft.duration ||
          draft.reading
      )
    ) {
      onError(
        'Preencha título, gênero e mood, e selecione um áudio válido para cada faixa.'
      );
      return;
    }
    if (!editing && createArtistInline && !inlineArtistName.trim()) {
      onError('Informe o nome do artista que será criado junto com o álbum.');
      return;
    }
    if (!createArtistInline && !artistId) {
      onError('Selecione o artista do álbum.');
      return;
    }

    void perform(
      async () => {
        let linkedArtistId = Number(artistId);
        if (!editing && createArtistInline) {
          const artist = await createArtist({
            name: inlineArtistName.trim(),
            biography: inlineArtistBiography.trim() || null,
            photoUrl: null,
          });
          linkedArtistId = artist.id;
          if (inlineArtistPhotoFile)
            await uploadArtistPhoto(artist.id, inlineArtistPhotoFile);
        }
        const payload = {
          title: title.trim(),
          artistId: editing ? Number(artistId) : linkedArtistId,
          releaseDate: releaseDate || null,
          coverUrl: coverFile
            ? (editing?.coverUrl ?? null)
            : coverUrl.trim() || null,
        };
        if (editing) {
          await updateAlbum(editing.id, payload);
          if (coverFile) await uploadAlbumCover(editing.id, coverFile);
        } else {
          const createdAlbum = await createAlbum(payload);
          if (coverFile) await uploadAlbumCover(createdAlbum.id, coverFile);
          for (const draft of drafts) {
            const createdTrack = await createTrack({
              title: draft.title.trim(),
              artistId: linkedArtistId,
              albumId: createdAlbum.id,
              genreId: Number(draft.genreId),
              moodId: Number(draft.moodId),
              durationSeconds: draft.duration!,
              audioUrl: null,
              coverUrl: null,
            });
            await uploadTrackAudio(createdTrack.id, draft.file!);
          }
        }
        cancel();
      },
      editing ? 'Álbum atualizado.' : 'Álbum e faixas adicionados ao catálogo.'
    );
  };

  return {
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
    setTitle,
    setArtistId,
    setReleaseDate,
    setCoverFile,
    setCoverUrl,
    setCreateArtistInline,
    setInlineArtistName,
    setInlineArtistBiography,
    setInlineArtistPhotoFile,
    updateDraft,
    addDraft,
    removeDraft,
    setDraftAudio,
    cancel,
    beginEdit,
    submit,
  };
}
