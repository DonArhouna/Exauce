import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/Button';
import { sendContactMessage } from '@/services/api/api';
import { ORGANIZATION } from '@/data/content.data';

/** Schéma de validation côté client (Zod). */
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(10),
});
type FormData = z.infer<typeof schema>;

/** Contact — formulaire validé, envoi mocké (branchement FastAPI prévu). */
export default function ContactPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setFailed(false);
    try {
      await sendContactMessage(data);
      setSent(true);
    } catch {
      setFailed(true);
    }
  };

  const field =
    'w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-500/30';
  const err = 'mt-1 text-xs text-red-600';

  return (
    <Page title={`${t('nav.contact')} — EXAUCE`}>
      <PageHero title={t('nav.contact')} crumbs={[{ label: t('nav.contact') }]} />
      <section className="py-section-sm md:py-section">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1.2fr_1fr]">
          {/* Formulaire */}
          {sent ? (
            <div className="rounded-card border border-turquoise-500/30 bg-turquoise-500/10 p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-turquoise-600" aria-hidden="true" />
              <p className="mt-4 text-sm text-ink">{t('contact.success')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-card border border-ink/8 bg-white p-8 shadow-card" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-600">
                    {t('contact.name')} *
                  </label>
                  <input id="name" {...register('name')} className={field} />
                  {errors.name && <p className={err}>{t('contact.required')}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600">
                    {t('contact.email')} *
                  </label>
                  <input id="email" type="email" {...register('email')} className={field} />
                  {errors.email && <p className={err}>{t('contact.invalidEmail')}</p>}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-600">
                    {t('contact.phone')}
                  </label>
                  <input id="phone" type="tel" {...register('phone')} className={field} />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-slate-600">
                    {t('contact.subject')} *
                  </label>
                  <input id="subject" {...register('subject')} className={field} />
                  {errors.subject && <p className={err}>{t('contact.required')}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-slate-600">
                  {t('contact.message')} *
                </label>
                <textarea id="message" rows={5} {...register('message')} className={field} />
                {errors.message && <p className={err}>{t('contact.required')}</p>}
              </div>
              {failed && <p className="text-sm text-red-600">{t('contact.error')}</p>}
              <Button type="submit" disabled={isSubmitting}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {t('contact.send')}
              </Button>
            </form>
          )}

          {/* Coordonnées */}
          <aside className="rounded-card bg-abyss-gradient p-8 text-ivory">
            <h2 className="font-display text-display-md">{ORGANIZATION.name}</h2>
            <ul className="mt-6 space-y-4 text-sm text-white/75">
              <li>
                <a href={`mailto:${ORGANIZATION.email}`} className="hover:text-turquoise-400">
                  {ORGANIZATION.email}
                </a>
              </li>
              <li>{ORGANIZATION.phoneFixed}</li>
              <li>{ORGANIZATION.phoneMobile}</li>
              <li>{t('contact.address')}</li>
            </ul>
          </aside>
        </div>
      </section>
    </Page>
  );
}
