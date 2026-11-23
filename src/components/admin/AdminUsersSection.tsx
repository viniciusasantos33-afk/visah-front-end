import { useState, type FormEvent } from 'react';
import type { AdminUser } from '../../services/models';
import { Icon } from '../Icon';

type AdminUsersSectionProps = {
  users: AdminUser[];
  currentUserId: number;
  busy: boolean;
  onSave: (
    id: number,
    changes: Pick<AdminUser, 'name' | 'role' | 'isActive'>
  ) => Promise<boolean>;
  onDeactivate: (user: AdminUser) => void;
};

export function AdminUsersSection({
  users,
  currentUserId,
  busy,
  onSave,
  onDeactivate,
}: AdminUsersSectionProps) {
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('User');
  const [active, setActive] = useState(true);

  const beginEdit = (user: AdminUser) => {
    setEditing(user);
    setName(user.name);
    setRole(user.role);
    setActive(user.isActive);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    void onSave(editing.id, { name: name.trim(), role, isActive: active }).then(
      (saved) => {
        if (saved) setEditing(null);
      }
    );
  };

  return (
    <>
      <div className="admin-form__heading admin-users-heading">
        <h3>Perfis e permissões</h3>
        <p>
          Promova contas a administradoras, edite nomes ou desative o acesso.
        </p>
      </div>
      {editing && (
        <form className="admin-user-edit" onSubmit={submit}>
          <label>
            <span>Nome</span>
            <input
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span>Permissão</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="User">Usuário</option>
              <option value="Admin">Administrador</option>
            </select>
          </label>
          <label className="admin-user-active">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Conta ativa
          </label>
          <div className="admin-form__actions">
            <button className="admin-submit" type="submit" disabled={busy}>
              Salvar perfil
              <Icon name="arrow_forward" />
            </button>
            <button
              type="button"
              className="admin-cancel"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <div className="admin-manage-list">
        {users.map((account) => (
          <div
            className={`admin-manage-row${account.isActive ? '' : 'is-inactive'}`}
            key={account.id}
          >
            <span>
              <strong>
                {account.name}
                {account.id === currentUserId && (
                  <small className="admin-you-label">Você</small>
                )}
              </strong>
              <small>
                {account.email} ·{' '}
                {account.role === 'Admin' ? 'Administrador' : 'Usuário'} ·{' '}
                {account.isActive ? 'Ativo' : 'Desativado'}
              </small>
            </span>
            <div className="admin-row-actions">
              <button
                type="button"
                aria-label={`Editar perfil ${account.name}`}
                onClick={() => beginEdit(account)}
              >
                <Icon name="edit" />
              </button>
              {account.id !== currentUserId && account.isActive && (
                <button
                  type="button"
                  className="is-danger"
                  aria-label={`Desativar perfil ${account.name}`}
                  onClick={() => onDeactivate(account)}
                >
                  <Icon name="person_off" />
                </button>
              )}
            </div>
          </div>
        ))}
        {!users.length && (
          <p className="admin-list-empty">Nenhum perfil encontrado.</p>
        )}
      </div>
    </>
  );
}
