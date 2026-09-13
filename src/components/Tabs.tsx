import {
  CalendarDays,
  ListOrdered,
  Goal,
  History,
  BarChart3,
} from 'lucide-react';
export type Tab = 'matches' | 'table' | 'scorers' | 'history' | 'insights';
const tabs = [
  { id: 'matches', label: 'Matches', icon: CalendarDays },
  { id: 'table', label: 'Table', icon: ListOrdered },
  { id: 'scorers', label: 'Scorers', icon: Goal },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
] as const;
export function Tabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="tabs-wrap">
      <div className="tabs" role="tablist" aria-label="Dashboard sections">
        {tabs.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => {
              const next =
                e.key === 'ArrowRight'
                  ? (index + 1) % tabs.length
                  : e.key === 'ArrowLeft'
                    ? (index + tabs.length - 1) % tabs.length
                    : e.key === 'Home'
                      ? 0
                      : e.key === 'End'
                        ? tabs.length - 1
                        : null;
              if (next !== null) {
                e.preventDefault();
                onChange(tabs[next].id);
                document.getElementById(`tab-${tabs[next].id}`)?.focus();
              }
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
      <span className="timezone">
        Times in{' '}
        {Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_', ' ')}
      </span>
    </nav>
  );
}
