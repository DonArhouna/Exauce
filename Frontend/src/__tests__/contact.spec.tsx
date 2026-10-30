import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import ContactPage from '../pages/ContactPage';
import * as api from '../services/api/api';

/** Validation du formulaire de contact (Zod) + contrat OpenAPI POST /contact (EF-301..303). */
function setup(initialRoute = '/fr') {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ContactPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Formulaire de contact', () => {
  it('affiche des erreurs sur données manquantes et ne soumet pas', async () => {
    const spy = vi.spyOn(api, 'sendContactMessage');
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findAllByText(/obligatoire|requis|invalide/i)).not.toHaveLength(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('envoie avec des données valides en honorant le contrat OpenAPI (lang, honeypot, elapsed_ms, Idempotency-Key, 202)', async () => {
    const spy = vi.spyOn(api, 'sendContactMessage').mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'new',
    });

    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nom complet/i), 'Jean Sene');
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'jean@exemple.sn');
    await user.type(screen.getByLabelText(/téléphone/i), '+221 77 123 45 67');
    await user.type(screen.getByLabelText(/sujet/i), 'Audit légal');
    await user.type(screen.getByLabelText(/message/i), 'Merci de nous contacter au sujet de nos états financiers annuels.');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    expect(await screen.findByText(/envoyé/i)).toBeTruthy();

    expect(spy).toHaveBeenCalledTimes(1);
    const [payload, options] = spy.mock.calls[0];

    // Vérification du payload ContactRequest
    expect(payload).toEqual(
      expect.objectContaining({
        name: 'Jean Sene',
        email: 'jean@exemple.sn',
        phone: '+221 77 123 45 67',
        subject: 'Audit légal',
        message: 'Merci de nous contacter au sujet de nos états financiers annuels.',
        lang: 'fr',
        honeypot: '',
        elapsed_ms: expect.any(Number),
      }),
    );
    expect(payload.elapsed_ms).toBeGreaterThanOrEqual(0);

    // Vérification de l'en-tête Idempotency-Key
    expect(options?.idempotencyKey).toBeDefined();
    expect(typeof options?.idempotencyKey).toBe('string');
    expect(options?.idempotencyKey!.length).toBeGreaterThan(0);
  });

  it('leurre les robots : si le honeypot est rempli, feint le succès sans appeler l\'API (EF-303)', async () => {
    const spy = vi.spyOn(api, 'sendContactMessage');

    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nom complet/i), 'Robot Spam');
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'bot@spam.com');
    await user.type(screen.getByLabelText(/sujet/i), 'Spam Offer');
    await user.type(screen.getByLabelText(/message/i), 'Buy cheap crypto now with immediate delivery guaranteed.');

    // Remplissage du champ honeypot invisible par un bot
    const honeypotInput = screen.getByLabelText(/ne pas remplir/i);
    fireEvent.change(honeypotInput, { target: { value: 'http://spam-link.ru' } });

    await user.click(screen.getByRole('button', { name: /envoyer/i }));

    // Le succès est affiché pour leurrer le bot
    expect(await screen.findByText(/envoyé/i)).toBeTruthy();
    // L'API n'a JAMAIS été appelée (rejet silencieux)
    expect(spy).not.toHaveBeenCalled();
  });
});
