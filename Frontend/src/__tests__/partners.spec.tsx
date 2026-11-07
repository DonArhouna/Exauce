import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import PartnersPage from '@/pages/PartnersPage';
import { LogoMarquee } from '@/components/ui/LogoMarquee';
import { PARTNERS_MOCK } from '@/data/content.data';

describe('Page Partenaires', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('route /fr/partenaires rend le titre de page partenaires (FR)', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr/partenaires']}>
          <Routes>
            <Route path="/:lang">
              <Route path="partenaires" element={<PartnersPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /Nos partenaires/i })).toBeInTheDocument();
  });

  it('route /en/partners rend le titre en anglais (EN)', async () => {
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/en/partners']}>
          <Routes>
            <Route path="/:lang">
              <Route path="partners" element={<PartnersPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /Our partners/i })).toBeInTheDocument();
  });

  it('affiche "Partenaires" dans le header desktop (FR)', async () => {
    await i18n.changeLanguage('fr');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <Header onSearchOpen={() => {}} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const links = screen.getAllByRole('link', { name: /^partenaires$/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('affiche "Partners" dans la nav EN', async () => {
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/en']}>
          <Header onSearchOpen={() => {}} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const links = screen.getAllByRole('link', { name: /^partners$/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('affiche un lien "Partenaires" dans le footer (FR)', async () => {
    await i18n.changeLanguage('fr');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <Footer />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const links = screen.getAllByRole('link', { name: /partenaires/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it('affiche « Partenaires » dans le menu mobile (FR)', async () => {
    await i18n.changeLanguage('fr');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <Header onSearchOpen={() => {}} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^menu$/i }));
    const items = screen.getAllByRole('button', { name: /^partenaires$/i });
    expect(items.length).toBeGreaterThan(0);
  });
});

describe('LogoMarquee — accessibilité', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('affiche la liste statique quand prefers-reduced-motion est réduit', () => {
    // Mock matchMedia to return true for prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <LogoMarquee partners={PARTNERS_MOCK} lang="fr" />
        </MemoryRouter>
      </I18nextProvider>,
    );

    // Avec prefers-reduced-motion, les images sont affichées directement (pas de style animation)
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBe(PARTNERS_MOCK.length);
    // Chaque image a un alt non-vide (liste statique accessible)
    imgs.forEach((img) => {
      expect(img).toHaveAttribute('alt');
      expect(img.getAttribute('alt')).not.toBe('');
    });
  });

  it("affiche le bouton Pause/Play qui change d'état au clic (mode normal)", () => {
    // Reset matchMedia to no prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <LogoMarquee partners={PARTNERS_MOCK} lang="fr" />
        </MemoryRouter>
      </I18nextProvider>,
    );

    const pauseBtn = screen.getByRole('button', { name: /mettre en pause/i });
    expect(pauseBtn).toBeInTheDocument();
    expect(pauseBtn).toHaveAttribute('aria-pressed', 'false');

    // Click to pause
    act(() => {
      fireEvent.click(pauseBtn);
    });

    const playBtn = screen.getByRole('button', { name: /reprendre/i });
    expect(playBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('les images aria-hidden ont un alt vide et la sr-only list a les alts réels', () => {
    // Reset to no prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/fr']}>
          <LogoMarquee partners={PARTNERS_MOCK} lang="fr" />
        </MemoryRouter>
      </I18nextProvider>,
    );

    // aria-hidden images should have empty alt
    const ariaHiddenContainer = document.querySelector('[aria-hidden="true"]');
    expect(ariaHiddenContainer).toBeInTheDocument();
    const ariaHiddenImgs = ariaHiddenContainer!.querySelectorAll('img');
    ariaHiddenImgs.forEach((img) => {
      expect(img.getAttribute('alt')).toBe('');
    });

    // sr-only list should contain the real alt texts
    PARTNERS_MOCK.forEach((p) => {
      expect(screen.getByText(p.alt.fr)).toBeInTheDocument();
    });
  });
});
