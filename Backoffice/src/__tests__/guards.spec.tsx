import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMockBackend, expireMockSession } from '@/services/api/mock/db';
import { renderApp, signIn } from './harness';

describe('gardes de routes', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('redirige un visiteur non connecté vers la connexion', async () => {
    renderApp('/publications');
    expect(await screen.findByRole('heading', { name: /connexion/i })).toBeInTheDocument();
  });

  it('revient à la page demandée après connexion', async () => {
    renderApp('/publications');
    await signIn('fondateur@exauceac.com', 'exauce-fondateur-2026');

    expect(await screen.findByRole('heading', { name: /bientôt disponible/i })).toBeInTheDocument();
    const breadcrumb = screen.getByRole('navigation', { name: /fil d/i });
    expect(within(breadcrumb).getByText('Publications')).toBeInTheDocument();
  });

  it('signale une session expirée après un 401 global', async () => {
    renderApp('/tableau-de-bord');
    await signIn('fondateur@exauceac.com', 'exauce-fondateur-2026');
    await screen.findByRole('heading', { name: /tableau de bord/i });

    expireMockSession();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /menu utilisateur/i }));
    await user.click(screen.getByRole('menuitem', { name: /se déconnecter/i }));

    expect(await screen.findByText(/votre session a expiré/i)).toBeInTheDocument();
  });
});
