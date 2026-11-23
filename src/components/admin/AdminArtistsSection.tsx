import { useState, type FormEvent } from 'react';
import type { ApiArtist } from '../../types/catalog';
import { Icon } from '../Icon';

type AdminArtistsSectionProps = {
  artists: ApiArtist[];
  busy: boolean;
  onSave: (
    id: number | null,
    artist: Pick<ApiArtist, 'name' | 'biography' | 'photoUrl'>,
    photoFile: File | null
  ) => Promise<boolean>;
  onDelete: (artist: ApiArtist) => void;
};

export function AdminArtistsSection({
  artists,
  busy,
  onSave,
  onDelete,
}: AdminArtistsSectionProps) {
  const [editing, setEditing] = useState<ApiArtist | null>(null);
  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const reset = () => {
    setEditing(null);
    setName('');
    setBiography('');
    setPhotoUrl('');
    setPhotoFile(null);
  };

  const beginEdit = (artist: ApiArtist) => {
    setEditing(artist);
    setName(artist.name);
    setBiography(artist.biography ?? '');
    setPhotoUrl(artist.photoUrl ?? '');
    setPhotoFile(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const artist = {
      name: name.trim(),
      biography: biography.trim() || null,
      photoUrl: photoFile
        ? (editing?.photoUrl ?? null)
        : photoUrl.trim() || null,
    };
    void onSave(editing?.id ?? null, artist, photoFile).then((saved) => {
      if (saved) reset();
    });
  };

  return (
    <>
      <form className="admin-form admin-form--compact" onSubmit={submit}>
        <div className="admin-form__heading">
          <h3>{editing ? 'Editar artista' : 'Adicionar artista'}</h3>
          <p>Atualize os dados exibidos no catálogo.</p>
        </div>
        <label>
          <span>Nome</span>
          <input
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do artista"
          />
        </label>
        <label>
          <span>
            Biografia <small>opcional</small>
          </span>
          <textarea
            maxLength={2000}
            rows={3}
            value={biography}
            onChange={(event) => setBiography(event.target.value)}
            placeholder="Biografia"
          />
        </label>
        <label>
          <span>
            Foto do artista <small>JPG, PNG, WEBP ou GIF · até 10 MB</small>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
          />
          {photoFile && (
            <small className="admin-file-picked">
              <Icon name="image" />
              {photoFile.name}
            </small>
          )}
          {!photoFile && (
            <input
              type="url"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="Ou informe uma URL HTTPS"
            />
          )}
        </label>
        <div className="admin-form__actions">
          <button className="admin-submit" type="submit" disabled={busy}>
            {editing ? 'Salvar artista' : 'Adicionar artista'}
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
        {artists.map((artist) => (
          <div className="admin-manage-row" key={artist.id}>
            <img
              className="admin-manage-avatar"
              src={artist.photoUrl || '/profile-placeholder.svg'}
              alt=""
            />
            <span>
              <strong>{artist.name}</strong>
              <small>
                {artist.playCount.toLocaleString('pt-BR')} reproduções · ID{' '}
                {artist.id}
              </small>
            </span>
            <div className="admin-row-actions">
              <button
                type="button"
                aria-label={`Editar ${artist.name}`}
                onClick={() => beginEdit(artist)}
              >
                <Icon name="edit" />
              </button>
              <button
                type="button"
                className="is-danger"
                aria-label={`Remover ${artist.name}`}
                onClick={() => onDelete(artist)}
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>
        ))}
        {!artists.length && (
          <p className="admin-list-empty">Ainda não há artistas cadastrados.</p>
        )}
      </div>
    </>
  );
}
