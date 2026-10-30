import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Send,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  MapPinned,
  ArrowDown,
} from 'lucide-react';
import { Page } from '@/components/layout/Page';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { sendContactMessage } from '@/services/api/api';
import { ORGANIZATION, OFFICES } from '@/data/content.data';
import type { Lang } from '@/types/content';

/** Schéma de validation côté client (Zod). */
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(10),
});
type FormData = z.infer<typeof schema>;

/**
 * Page Contact unifiée — regroupe le formulaire de contact, les coordonnées directes
 * et la section des implantations du cabinet (bureaux, siège Dakar, carte).
 */
export default function ContactPage() {
  const { t } = useTranslation();
  const { lang = 'fr' } = useParams();
  const l = lang as Lang;

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
    <Page
      title={`${t('nav.contact')} — EXAUCE Audit & Conseils`}
      description={t('contact.introText')}
    >
      <PageHero
        title={t('nav.contact')}
        intro={t('contact.introText')}
        crumbs={[{ label: t('nav.contact') }]}
      />

      {/* Section 1 : Formulaire & coordonnées directes */}
      <section className="py-section-sm md:py-section">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1.2fr_1fr]">
          {/* Formulaire */}
          {sent ? (
            <div className="rounded-card border border-turquoise-500/30 bg-turquoise-500/10 p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-turquoise-600" aria-hidden="true" />
              <p className="mt-4 text-sm text-ink">{t('contact.success')}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 rounded-card border border-ink/8 bg-white p-8 shadow-card"
              noValidate
            >
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

          {/* Coordonnées principales */}
          <aside className="flex flex-col justify-between rounded-card bg-abyss-gradient p-8 text-ivory">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-turquoise-400">
                {t('contact.officeName')}
              </p>
              <h2 className="mt-2 font-display text-display-md">
                {t('contact.companyName', ORGANIZATION.name)}
              </h2>
              <ul className="mt-6 space-y-4 text-sm text-white/75">
                <li>
                  <a
                    href={`mailto:${ORGANIZATION.email}`}
                    className="inline-flex items-center gap-2.5 hover:text-turquoise-400"
                  >
                    <Mail className="h-4 w-4 text-turquoise-400" aria-hidden="true" />
                    {ORGANIZATION.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${ORGANIZATION.phoneFixed.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2.5 hover:text-turquoise-400"
                  >
                    <Phone className="h-4 w-4 text-turquoise-400" aria-hidden="true" />
                    {ORGANIZATION.phoneFixed} <span className="text-white/40">({t('contact.fixed')})</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${ORGANIZATION.phoneMobile.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2.5 hover:text-turquoise-400"
                  >
                    <Smartphone className="h-4 w-4 text-turquoise-400" aria-hidden="true" />
                    {ORGANIZATION.phoneMobile} <span className="text-white/40">({t('contact.mobile')})</span>
                  </a>
                </li>
                <li className="inline-flex items-center gap-2.5 text-white/75">
                  <MapPin className="h-4 w-4 text-turquoise-400" aria-hidden="true" />
                  {t('contact.address')}
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <a
                href="#implantations"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-turquoise-400 hover:text-turquoise-300"
              >
                <span>{t('contact.viewOffices')}</span>
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Section 2 : Nos implantations (ancre #implantations) */}
      <section
        id="implantations"
        className="scroll-mt-24 border-t border-ink/5 bg-ink/[0.02] py-section-sm md:py-section"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-display-md text-ink">{t('contact.officesTitle')}</h2>
            <p className="mt-3 text-sm text-slate-600">{t('contact.officesIntro')}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {OFFICES.map((office, i) => (
              <Reveal key={office.id} delay={i * 0.08}>
                <article className="rounded-card border border-ink/8 bg-white p-8 shadow-card">
                  <header className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-turquoise-600" aria-hidden="true" />
                      <h3 className="font-display text-xl text-ink">{office.name?.[l]}</h3>
                    </div>
                    {office.isHeadquarters && (
                      <span className="rounded-full bg-turquoise-100 px-3 py-1 text-xs font-semibold text-turquoise-900">
                        {t('contact.headquarters')}
                      </span>
                    )}
                  </header>

                  {/* Placeholder adresse vérifiée */}
                  <div className="mt-5 rounded-xl border border-dashed border-turquoise-500/40 bg-turquoise-500/5 p-5">
                    <p className="text-sm text-slate-600">{t('contact.addressesComing')}</p>
                    {office.city && (
                      <p className="mt-2 text-sm font-medium text-turquoise-800">{office.city[l]}</p>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Emplacement carte géographique */}
          <div className="mt-10">
            <Reveal>
              <div
                role="img"
                aria-label={t('contact.mapComing')}
                title={t('contact.mapComing')}
                className="relative flex h-64 items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-turquoise-500/40 bg-abyss-gradient text-ivory md:h-80"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(78,185,174,0.18)_0%,transparent_60%)]"
                />
                <div className="absolute text-center">
                  <MapPinned className="mx-auto h-10 w-10 text-turquoise-400" aria-hidden="true" />
                  <p className="mt-4 text-sm text-white/70">{t('contact.mapComing')}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </Page>
  );
}
