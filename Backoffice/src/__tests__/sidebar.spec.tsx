import { screen, within } from '@testing-library/react';
import { resetMockBackend } from '@/services/api/mock/db';
import { renderApp, signIn } from './harness';

async function sidebar() {
  return screen.findByRole('complementary', { name: /navigation principale/i });
}

describe('sidebar', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('masque les entrées non autorisées pour un éditeur', async () => {
    renderApp('/connexion');
    await signIn('editeur@exauceac.com', 'exauce-editeur-2026');
    await screen.findByRole('heading', { name: /tableau de bord/i });

    const nav = await sidebar();
    expect(within(nav).getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /pages et sections/i })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /utilisateurs/i })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /demandes de contact/i })).not.toBeInTheDocument();
  });

  it('affiche toutes les entrées pour le fondateur et replie la navigation', async () => {
    renderApp('/connexion');
    const user = await signIn('fondateur@exauceac.com', 'exauce-fondateur-2026');
    await screen.findByRole('heading', { name: /tableau de bord/i });

    const nav = await sidebar();
    expect(within(nav).getByRole('link', { name: /utilisateurs/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /journal d’audit/i })).toBeInTheDocument();
    expect(nav).toHaveAttribute('data-collapsed', 'false');

    await user.click(within(nav).getByRole('button', { name: /replier la navigation/i }));

    expect(nav).toHaveAttribute('data-collapsed', 'true');
    expect(within(nav).getByRole('button', { name: /déplier la navigation/i })).toBeInTheDocument();
    // En mode icônes, chaque lien conserve un nom accessible.
    expect(within(nav).getByRole('link', { name: /tableau de bord/i })).toBeInTheDocument();
  });
});
