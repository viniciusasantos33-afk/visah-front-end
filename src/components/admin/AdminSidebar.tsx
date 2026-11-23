import { Icon } from '../Icon';
import type { AdminSection, AdminSectionItem } from './types';

type AdminSidebarProps = {
  active: AdminSection;
  sections: AdminSectionItem[];
  counts: Record<AdminSection, number>;
  onSelect: (section: AdminSection) => void;
};

export function AdminSidebar({
  active,
  sections,
  counts,
  onSelect,
}: AdminSidebarProps) {
  return (
    <nav className="admin-sidebar" aria-label="Seções administrativas">
      {sections.map((item) => (
        <button
          type="button"
          key={item.id}
          className={active === item.id ? 'active' : ''}
          onClick={() => onSelect(item.id)}
        >
          <Icon name={item.icon} />
          {item.label}
          <span>{counts[item.id]}</span>
        </button>
      ))}
    </nav>
  );
}
