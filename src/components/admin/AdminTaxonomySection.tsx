import type { FormEvent } from 'react';
import { useState } from 'react';
import type { Genre, Mood } from '../../types/catalog';
import { Icon } from '../Icon';

type TaxonomyItem = Pick<Genre | Mood, 'id' | 'name'>;
type AdminTaxonomySectionProps = {
  kind: 'genres' | 'moods';
  items: TaxonomyItem[];
  busy: boolean;
  onSave: (
    kind: 'genres' | 'moods',
    id: number | null,
    name: string
  ) => Promise<boolean>;
  onDelete: (item: TaxonomyItem) => void;
};

export function AdminTaxonomySection({
  kind,
  items,
  busy,
  onSave,
  onDelete,
}: AdminTaxonomySectionProps) {
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const isGenre = kind === 'genres';
  const label = isGenre ? 'gênero' : 'mood';

  const reset = () => {
    setEditId(null);
    setName('');
  };
  const edit = (id: number, value: string) => {
    setEditId(id);
    setName(value);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave(kind, editId, name.trim()).then((saved) => {
      if (saved) reset();
    });
  };

  return (
    <>
      <form className="admin-form admin-form--compact" onSubmit={submit}>
        <div className="admin-form__heading">
          <h2>
            {editId ? 'Editar' : 'Novo'} {label}
          </h2>
          <p>Os itens aparecem nos filtros do catálogo.</p>
        </div>
        <label>
          <span>Nome</span>
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={isGenre ? 'Ex.: MPB' : 'Ex.: Nostálgico'}
          />
        </label>
        <div className="admin-form__actions">
          <button className="admin-submit" type="submit" disabled={busy}>
            {busy ? 'Salvando…' : editId ? 'Salvar' : 'Adicionar'}
            <Icon name="arrow_forward" />
          </button>
          {editId && (
            <button type="button" className="admin-cancel" onClick={reset}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <div className="admin-manage-list">
        {items.map((item) => (
          <div className="admin-manage-row" key={item.id}>
            <span>
              <strong>{item.name}</strong>
              <small>ID {item.id}</small>
            </span>
            <div className="admin-row-actions">
              <button
                type="button"
                aria-label={`Editar ${item.name}`}
                onClick={() => edit(item.id, item.name)}
              >
                <Icon name="edit" />
              </button>
              <button
                type="button"
                className="is-danger"
                aria-label={`Remover ${item.name}`}
                onClick={() => onDelete(item)}
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="admin-list-empty">
            Ainda não há {isGenre ? 'gêneros' : 'moods'} cadastrados.
          </p>
        )}
      </div>
    </>
  );
}
