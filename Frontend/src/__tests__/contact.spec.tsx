import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import ContactPage from '../pages/ContactPage';

/** Validation du formulaire de contact (Zod) + envoi mocké. */
function setup() {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/fr']}>
        <ContactPage />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

beforeAll(async () => {
  await i18n.changeLanguage('fr');
});

describe('Formulaire de contact', () => {
  it('affiche des erreurs sur données manquantes et ne soumet pas', async () => {
    setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findAllByText(/obligatoire|requis|invalide/i)).not.toHaveLength(0);
  });

  it('envoie avec des données valides (mock honore le contrat)', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/nom complet/i), 'Jean Sene');
    await user.type(screen.getByLabelText(/adresse e-mail/i), 'jean@exemple.sn');
    await user.type(screen.getByLabelText(/sujet/i), 'Audit');
    await user.type(screen.getByLabelText(/message/i), 'Merci de nous contacter au sujet de nos états financiers.');
    await user.click(screen.getByRole('button', { name: /envoyer/i }));
    expect(await screen.findByText(/envoyé/i)).toBeTruthy();
  });
});
