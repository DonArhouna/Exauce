/**
 * publications-media.spec.tsx
 * Tests Vitest + Testing Library pour le Lot 2 — Galerie médias publications.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { MediaGallery } from '@/components/ui/MediaGallery';
import { PubCard } from '@/pages/PublicationsPage';
import { PUBLICATIONS_MOCK } from '@/data/content.data';
import { pubCover, pubHasVideo, pubMediaCount } from '@/lib/media';
import type { PublicationMedia } from '@/types/content';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  );
}

function renderGallery(media: PublicationMedia[], lang: 'fr' | 'en' = 'fr') {
  return renderWithProviders(<MediaGallery media={media} lang={lang} />);
}

// ---------------------------------------------------------------------------
// Fixtures from mock data
// ---------------------------------------------------------------------------

const pub1 = PUBLICATIONS_MOCK.find((p) => p.id === 'pub-1')!;
const pub3 = PUBLICATIONS_MOCK.find((p) => p.id === 'pub-3')!;
const pub4 = PUBLICATIONS_MOCK.find((p) => p.id === 'pub-4')!;
const pub6 = PUBLICATIONS_MOCK.find((p) => p.id === 'pub-6')!;

beforeEach(async () => {
  // Les libellés attendus par les tests sont français.
  await i18n.changeLanguage('fr');
});

// ---------------------------------------------------------------------------
// MediaGallery — pub-3 (5 images)
// ---------------------------------------------------------------------------

describe('MediaGallery — pub-3 (5 images)', () => {
  it('affiche "1 / 5" au démarrage', () => {
    renderGallery(pub3.media!);
    expect(screen.getByText(/1\s*\/\s*5/)).toBeInTheDocument();
  });

  it('le bouton suivant change l\'indicateur à "2 / 5"', async () => {
    const user = userEvent.setup();
    renderGallery(pub3.media!);
    const nextBtn = screen.getByRole('button', { name: /média suivant|next media/i });
    await user.click(nextBtn);
    expect(screen.getByText(/2\s*\/\s*5/)).toBeInTheDocument();
  });

  it('touche ArrowRight change le slide (1→2)', async () => {
    renderGallery(pub3.media!);
    expect(screen.getByText(/1\s*\/\s*5/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/2\s*\/\s*5/)).toBeInTheDocument();
  });

  it('touche ArrowLeft sur le premier slide va au dernier (borne circulaire, 1→5)', async () => {
    renderGallery(pub3.media!);
    expect(screen.getByText(/1\s*\/\s*5/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/5\s*\/\s*5/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MediaGallery — pub-6 (12 images)
// ---------------------------------------------------------------------------

describe('MediaGallery — pub-6 (12 images)', () => {
  it('affiche "1 / 12" au démarrage', () => {
    renderGallery(pub6.media!);
    expect(screen.getByText(/1\s*\/\s*12/)).toBeInTheDocument();
  });

  it('touche ArrowLeft sur premier slide va au 12ème (1→12)', () => {
    renderGallery(pub6.media!);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/12\s*\/\s*12/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MediaGallery — pub-4 (1 vidéo)
// ---------------------------------------------------------------------------

describe('MediaGallery — pub-4 (1 vidéo)', () => {
  it('n\'affiche pas de boutons précédent/suivant (1 seul média)', () => {
    renderGallery(pub4.media!);
    expect(
      screen.queryByRole('button', { name: /média précédent|prev media/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /média suivant|next media/i }),
    ).not.toBeInTheDocument();
  });

  it('l\'iframe vidéo n\'est PAS dans le DOM avant le clic sur le poster', () => {
    renderGallery(pub4.media!);
    // The iframe is only mounted after clicking play
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    // More specifically: no iframe element
    const { container } = renderGallery(pub4.media!);
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MediaGallery — pub-1 (sans média)
// ---------------------------------------------------------------------------

describe('Publications sans média', () => {
  it('pub-1 : pas de galerie dans le DOM', () => {
    if (!pub1.media || pub1.media.length === 0) {
      // pub-1 has no media: MediaGallery returns null
      const { container } = renderGallery([]);
      // Should render nothing meaningful
      expect(container.firstChild).toBeNull();
    } else {
      // If pub-1 somehow has media, skip — but this shouldn't happen
      expect(pub1.media.length).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// PubCard — badges médias
// ---------------------------------------------------------------------------

describe('PubCard — badges médias', () => {
  it('pub-3 : affiche un badge indiquant 5 médias', () => {
    renderWithProviders(<PubCard pub={pub3} lang="fr" />);
    // Badge should contain "5" and something like "médias" or "media"
    const badge = screen.getByText(/5\s*(médias?|media)/i);
    expect(badge).toBeInTheDocument();
  });

  it('pub-1 (sans média) : pas de badge médias', () => {
    renderWithProviders(<PubCard pub={pub1} lang="fr" />);
    expect(screen.queryByText(/médias?/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dérivés média (lib/media) — cover et mediaCount ne sont jamais stockés
// ---------------------------------------------------------------------------

describe('Dérivés média (lib/media)', () => {
  it('pub-1 : 0 média, pas de couverture, pas de vidéo', () => {
    expect(pubMediaCount(pub1)).toBe(0);
    expect(pubCover(pub1)).toBeNull();
    expect(pubHasVideo(pub1)).toBe(false);
  });

  it('pub-3 : 5 médias, couverture = premier média', () => {
    expect(pubMediaCount(pub3)).toBe(5);
    expect(pubCover(pub3)?.id).toBe('pub-3-media-1');
  });

  it('pub-6 : 12 médias, le coverId désigné prime sur le premier média', () => {
    expect(pubMediaCount(pub6)).toBe(12);
    expect(pubCover(pub6)?.id).toBe('pub-6-media-3');
  });

  it('pub-4 : contient une vidéo', () => {
    expect(pubHasVideo(pub4)).toBe(true);
  });
});
