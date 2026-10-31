import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/services/auth/useAuth';
import { visibleItems } from './navigation';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

/** Recherche limitée aux entrées de navigation (le contrat expose un stub). */
export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const needle = query.trim().toLowerCase();
  const items = visibleItems(permissions).filter((item) =>
    needle ? t(item.labelKey).toLowerCase().includes(needle) : true,
  );

  return (
    <Modal open={open} onClose={onClose} title={t('search.title')} size="md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="pl-9"
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{t('search.hint')}</p>

      <div className="mt-4 max-h-72 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">{t('search.noResults')}</p>
        ) : (
          <ul aria-label={t('search.navigation')} className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm text-ink hover:bg-ivory"
                  >
                    <Icon className="h-4 w-4 text-turquoise-700" aria-hidden="true" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 rounded-control bg-ivory px-3 py-2 text-xs text-muted">{t('search.contentSoon')}</p>
    </Modal>
  );
}
