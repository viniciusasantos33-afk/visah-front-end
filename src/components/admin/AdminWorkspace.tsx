import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import type { AdminSectionItem } from './types';

export function AdminWorkspace({
  section,
  children,
}: {
  section: AdminSectionItem | undefined;
  children: ReactNode;
}) {
  return (
    <div className="admin-workspace">
      <div className="admin-workspace__heading">
        <div>
          <span>Gerenciar</span>
          <h2>{section?.label}</h2>
        </div>
        <Icon name={section?.icon ?? 'settings'} />
      </div>
      {children}
    </div>
  );
}
