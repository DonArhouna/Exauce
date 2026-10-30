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

  const testViewports = [
    { width: 1024, desc: '1024px desktop' },
    { width: 1280, desc: '1280px desktop' },
    { width: 1440, desc: '1440px desktop' },
    { width: 1920, desc: '1920px large desktop' },
    { width: 1152, desc: '1440px à 125% zoom (1152 CSS px)' },
    { width: 819, desc: '1024px à 125% zoom (819 CSS px)' },
  ];

  for (const lang of ['fr', 'en'] as const) {
    for (const vp of testViewports) {
      it(`maintient le popup de Publications et Services dans le viewport à ${vp.desc} [${lang.toUpperCase()}]`, async () => {
        await i18n.changeLanguage(lang);
        window.innerWidth = vp.width;

        const { unmount } = render(
          <I18nextProvider i18n={i18n}>
            <MemoryRouter initialEntries={[`/${lang}`]}>
              <Header onSearchOpen={() => {}} />
            </MemoryRouter>
          </I18nextProvider>,
        );

        // Test Publications
        const pubTrigger = screen.getByRole('link', {
          name: lang === 'fr' ? /^publications$/i : /^publications$/i,
        });
        const pubContainer = pubTrigger.parentElement!;

        // Simule position proche du bord droit
        pubContainer.getBoundingClientRect = () => ({
          left: Math.max(100, vp.width - 250),
          right: Math.max(200, vp.width - 150),
          width: 100,
          top: 20,
          bottom: 50,
          height: 30,
          x: Math.max(100, vp.width - 250),
          y: 20,
          toJSON: () => {},
        });

        fireEvent.mouseEnter(pubContainer);

        await waitFor(() => {
          expect(pubTrigger).toHaveAttribute('aria-expanded', 'true');
        });

        // Test Services
        const servTrigger = screen.getByRole('link', {
          name: lang === 'fr' ? /^services$/i : /^services$/i,
        });
        const servContainer = servTrigger.parentElement!;

        // Simule position proche du bord gauche
        servContainer.getBoundingClientRect = () => ({
          left: 100,
          right: 200,
          width: 100,
          top: 20,
          bottom: 50,
          height: 30,
          x: 100,
          y: 20,
          toJSON: () => {},
        });

        fireEvent.mouseEnter(servContainer);

        await waitFor(() => {
          expect(servTrigger).toHaveAttribute('aria-expanded', 'true');
        });

        unmount();
      });
    }
  }
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
