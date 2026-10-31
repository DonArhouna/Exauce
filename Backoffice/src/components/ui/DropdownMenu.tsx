import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const MenuContext = createContext<{ close: () => void } | null>(null);

interface DropdownMenuProps {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  badge?: number;
  triggerClassName?: string;
}

/** Menu déclenché par un bouton-icône, fermé au clic extérieur et à Échap. */
export function DropdownMenu({
  label,
  trigger,
  children,
  align = 'end',
  badge,
  triggerClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const item = containerRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    item?.focus();
  }, [open]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (items.length === 0) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next].focus();
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative grid h-9 w-9 place-items-center rounded-control text-slate-500 transition-colors hover:bg-ink/5 hover:text-ink',
          open && 'bg-ink/5 text-ink',
          triggerClassName,
        )}
      >
        {trigger}
        {badge && badge > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-status-danger px-1 text-[10px] font-semibold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            'absolute top-full z-50 mt-2 min-w-56 animate-slide-up rounded-panel border border-line bg-surface p-1.5 shadow-pop',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <MenuContext.Provider value={{ close }}>{children}</MenuContext.Provider>
        </div>
      ) : null}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  icon?: LucideIcon;
  tone?: 'default' | 'danger';
}

export function DropdownMenuItem({ children, onSelect, icon: Icon, tone = 'default' }: DropdownMenuItemProps) {
  const menu = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.();
        menu?.close();
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors hover:bg-ivory focus-visible:bg-ivory',
        tone === 'danger' ? 'text-status-danger' : 'text-ink',
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-line" />;
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>;
}
