import { KeyRound, LogOut, SlidersHorizontal, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/services/auth/useAuth';

/** Profil, mot de passe, préférences et déconnexion. */
export function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const initials = (user?.display_name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <DropdownMenu
      label={t('nav.userMenu')}
      triggerClassName="rounded-full border border-line bg-surface"
      trigger={
        <span className="grid h-7 w-7 place-items-center rounded-full bg-abyss text-[10px] font-semibold text-white">
          {initials || '?'}
        </span>
      }
    >
      <DropdownMenuLabel>{t('userMenu.signedInAs', { name: user?.display_name ?? '' })}</DropdownMenuLabel>
      <DropdownMenuItem icon={UserRound} onSelect={() => navigate('/profil')}>
        {t('userMenu.profile')}
      </DropdownMenuItem>
      <DropdownMenuItem icon={KeyRound} onSelect={() => navigate('/mot-de-passe')}>
        {t('userMenu.changePassword')}
      </DropdownMenuItem>
      <DropdownMenuItem icon={SlidersHorizontal} onSelect={() => navigate('/preferences')}>
        {t('userMenu.preferences')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={LogOut}
        tone="danger"
        onSelect={() => {
          void logout()
            .then(() => navigate('/connexion', { replace: true }))
            .catch(() => {
              push({ title: t('userMenu.logoutError'), tone: 'error' });
            });
        }}
      >
        {t('userMenu.logout')}
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
