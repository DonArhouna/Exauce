import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { Header } from '@/components/layout/Header';
import PublicationsPage from '@/pages/PublicationsPage';
import App from '@/App';

describe('Header & Navigation Mega-Menus', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('ne contient plus Localisations mais Contact dans la navigation', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <Header onSearchOpen={() => {}} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.queryByRole('link', { name: /^localisations$/i })).toBeNull();
    const contactLinks = screen.getAllByRole('link', { name: /^contact$/i });
    expect(contactLinks.length).toBeGreaterThan(0);
  });

  it('affiche les sous-catégories de Publications au survol/focus clavier et se ferme avec Échap', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <Header onSearchOpen={() => {}} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const pubTrigger = screen.getByRole('link', { name: /^publications$/i });
    expect(pubTrigger).toHaveAttribute('aria-haspopup', 'true');
    expect(pubTrigger).toHaveAttribute('aria-expanded', 'false');

    // Survol du conteneur
    fireEvent.mouseEnter(pubTrigger.parentElement!);
    await waitFor(() => {
      expect(pubTrigger).toHaveAttribute('aria-expanded', 'true');
    });

    // Les sous-onglets apparaissent (Gouvernance, Audit, etc.)
    expect(screen.getByRole('link', { name: /^gouvernance$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^audit$/i })).toBeInTheDocument();

    // Fermeture avec Échap
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    await waitFor(() => {
      expect(pubTrigger).toHaveAttribute('aria-expanded', 'false');
    });
  });
});

describe('Page Publications — filtrage synchronisé dans l’URL', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('filtre automatiquement selon le paramètre d’URL ?category=governance', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr/publications?category=governance']}>
          <Routes>
            <Route path=":lang/publications" element={<PublicationsPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    // Le bouton Gouvernance est pressé
    const govBtn = screen.getByRole('button', { name: /^gouvernance$/i });
    expect(govBtn).toHaveAttribute('aria-pressed', 'true');

    // Seule la publication gouvernance est rendue
    expect(screen.getByText(/Gouvernance : la structuration/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cartographie des risques/i)).toBeNull();
  });
});

describe('Redirections d’anciennes URLs', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('redirige /fr/localisations vers /fr/contact#implantations', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr/localisations']}>
          <App />
        </MemoryRouter>
      </I18nextProvider>,
    );

    // Vérifie que le contenu de Contact (fusionné) est affiché
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Nos implantations/i })).toBeInTheDocument();
    });
  });
});
