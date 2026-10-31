import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/router';
import { resetMockBackend } from '@/services/api/mock/db';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('connexion', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('connecte le fondateur et ouvre le tableau de bord', async () => {
    const user = userEvent.setup();
    renderAt('/connexion');

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'fondateur@exauceac.com');
    await user.type(screen.getByLabelText(/^mot de passe/i), 'exauce-fondateur-2026');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('heading', { name: /tableau de bord/i })).toBeInTheDocument();
  });

  it('refuse un mot de passe incorrect avec un message clair', async () => {
    const user = userEvent.setup();
    renderAt('/connexion');

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'fondateur@exauceac.com');
    await user.type(screen.getByLabelText(/^mot de passe/i), 'mauvais-mot-de-passe');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/e-mail ou mot de passe incorrect/i);
  });

  it('demande le code TOTP quand le compte l’exige', async () => {
    const user = userEvent.setup();
    renderAt('/connexion');

    await user.type(screen.getByLabelText(/adresse e-mail/i), 'mfa@exauceac.com');
    await user.type(screen.getByLabelText(/^mot de passe/i), 'exauce-mfa-2026');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByLabelText(/code de vérification/i)).toBeInTheDocument();
  });
});
