import { screen, within } from '@testing-library/react';
import { resetMockBackend } from '@/services/api/mock/db';
import { renderApp, signIn } from './harness';

async function sidebarNav() {
  const aside = await screen.findByRole('complementary', { name: /navigation principale/i });
  return within(aside).getByRole('navigation', { name: /navigation principale/i });
}

describe('sidebar', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('masque les entrées non autorisées pour un éditeur', async () => {
    renderApp('/connexion');
    await signIn('editeur@exauceac.com', 'exauce-editeur-2026');
    await screen.findByRole('heading', { name: /tableau de bord/i });

    const nav = await sidebarNav();
    expect(within(nav).getByRole('link', { name: /services/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /pages et sections/i })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /utilisateurs/i })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /demandes de contact/i })).not.toBeInTheDocument();
  });

  it('affiche toutes les entrées pour le fondateur et replie la navigation', async () => {
    renderApp('/connexion');
    const user = await signIn('fondateur@exauceac.com', 'exauce-fondateur-2026');
    await screen.findByRole('heading', { name: /tableau de bord/i });

    const aside = await screen.findByRole('complementary', { name: /navigation principale/i });
    const nav = within(aside).getByRole('navigation', { name: /navigation principale/i });
    expect(within(nav).getByRole('link', { name: /utilisateurs/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /journal d’audit/i })).toBeInTheDocument();
    expect(aside).toHaveAttribute('data-collapsed', 'false');

    await user.click(within(aside).getByRole('button', { name: /replier la navigation/i }));

    expect(aside).toHaveAttribute('data-collapsed', 'true');
    expect(within(aside).getByRole('button', { name: /déplier la navigation/i })).toBeInTheDocument();
    // En mode icônes, chaque lien conserve un nom accessible.
    expect(within(nav).getByRole('link', { name: /tableau de bord/i })).toBeInTheDocument();
  });

  it('ne masque pas la barre avec overflow: hidden et porte la classe de masquage', async () => {
    renderApp('/connexion');
    await signIn('fondateur@exauceac.com', 'exauce-fondateur-2026');
    await screen.findByRole('heading', { name: /tableau de bord/i });

    const nav = await sidebarNav();
    const navStyle = getComputedStyle(nav);

    // Le conteneur ne doit pas avoir overflow: hidden.
    expect(navStyle.overflowY).not.toBe('hidden');
    // Il porte la classe de masquage de la barre.
    expect(nav).toHaveClass('sidebar-scroll');
  });
});
