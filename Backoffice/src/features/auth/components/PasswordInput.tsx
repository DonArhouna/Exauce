import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Field';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Champ mot de passe avec bouton-icône étiqueté. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ invalid, ...props }, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-11" invalid={invalid} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-control text-slate-400 hover:bg-ink/5 hover:text-ink"
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
