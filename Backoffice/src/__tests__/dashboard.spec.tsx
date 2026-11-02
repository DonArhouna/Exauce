import { screen, within } from '@testing-library/react';
import { resetMockBackend } from '@/services/api/mock/db';
import { renderApp, signIn } from './harness';

/** Zone de contenu (hors sidebar) où vivent les blocs du tableau de bord. */
async function mainContent() {
  return screen.findByRole('main');
}

describe('tableau de bord', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('reste accessible à un compte sans audit:view et masque les blocs non autorisés', async () => {
    renderApp('/connexion');
    await signIn('lecteur@exauceac.com', 'exauce-lecteur-2026');

    expect(await screen.findByRole('heading', { name: /tableau de bord/i })).toBeInTheDocument();

    const main = await mainContent();
    // Blocs autorisés (pages:view, publications:view).
    expect(within(main).getByText('Publications')).toBeInTheDocument();
    expect(within(main).getByText('Contenus modifiés non publiés')).toBeInTheDocument();
    // Blocs masqués faute de permission.
    expect(within(main).queryByText('Demandes de contact')).not.toBeInTheDocument();
    expect(within(main).queryByText('Dernières demandes')).not.toBeInTheDocument();
    expect(within(main).queryByText('Activité récente')).not.toBeInTheDocument();
    expect(within(main).queryByText('Complétude des traductions')).not.toBeInTheDocument();
  });

  it('affiche tous les blocs pour un compte disposant de toutes les permissions', async () => {
    renderApp('/connexion');
    await signIn('fondateur@exauceac.com', 'exauce-fondateur-2026');

    expect(await screen.findByRole('heading', { name: /tableau de bord/i })).toBeInTheDocument();

    const main = await mainContent();
    expect(within(main).getByText('Demandes de contact')).toBeInTheDocument();
    expect(within(main).getByText('Publications')).toBeInTheDocument();
    expect(within(main).getByText('Contenus modifiés non publiés')).toBeInTheDocument();
    expect(within(main).getByText('Dernières demandes')).toBeInTheDocument();
    expect(within(main).getByText('Activité récente')).toBeInTheDocument();
    expect(within(main).getByText('Complétude des traductions')).toBeInTheDocument();
  });
});
