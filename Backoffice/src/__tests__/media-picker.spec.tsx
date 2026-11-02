import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaPicker } from '@/components/media';
import { startSession, resetMockBackend } from '@/services/api/mock/db';
import { setCsrfToken } from '@/services/api/csrf';
import type { MediaSelection } from '@/lib/media';

const FOUNDER_ID = '11111111-1111-4111-8111-111111111111';

function Harness({ initial = null }: { initial?: MediaSelection | null }) {
  const [value, setValue] = useState<MediaSelection | null>(initial);
  return (
    <>
      <MediaPicker id="hero-image" label="Visuel de la section" value={value} onChange={setValue} />
      <output data-testid="state">
        {value ? `${value.id}|${value.alt.fr ?? ''}|${value.alt.en ?? ''}|${value.decorative}` : 'vide'}
      </output>
    </>
  );
}

function renderPicker(initial?: MediaSelection | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Harness initial={initial} />
    </QueryClientProvider>,
  );
}

const image: MediaSelection = {
  id: 'eeeeeeee-0001-4001-8001-000000000001',
  name: 'accueil-hero.jpg',
  kind: 'image',
  url: 'data:image/svg+xml;utf8,%3Csvg%2F%3E',
  mime: 'image/jpeg',
  alt: {},
  decorative: false,
};

describe('MediaPicker', () => {
  beforeEach(() => {
    resetMockBackend();
    const session = startSession(FOUNDER_ID);
    setCsrfToken(session.csrf);
  });

  afterEach(() => {
    setCsrfToken(null);
  });

  it('exige un texte alternatif par langue pour une image non décorative', async () => {
    const user = userEvent.setup();
    renderPicker(image);

    expect(screen.getByText('Le texte alternatif est obligatoire (Français).')).toBeInTheDocument();
    expect(screen.getByText('Le texte alternatif est obligatoire (English).')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/texte alternatif \(français\)/i), 'Façade du cabinet');

    // Il ne reste que l'anglais.
    expect(screen.queryByText('Le texte alternatif est obligatoire (Français).')).not.toBeInTheDocument();
    expect(screen.getByText('Le texte alternatif est obligatoire (English).')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/image purement décorative/i));
    expect(screen.queryByText(/le texte alternatif est obligatoire/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('state').textContent).toContain('|true');
  });

  it('choisit un média dans la médiathèque et reprend son texte alternatif', async () => {
    const user = userEvent.setup();
    renderPicker(null);

    await user.click(screen.getByRole('button', { name: /choisir un média/i }));
    const item = await screen.findByRole('button', { name: /façade du cabinet exauce/i });
    await user.click(item);

    expect(screen.getByTestId('state').textContent).toContain('eeeeeeee-0001-4001-8001-000000000001');
    expect(screen.getByTestId('state').textContent).toContain('Façade du cabinet EXAUCE à Dakar');
  });

  it('refuse un fichier dont le format n’est pas autorisé', async () => {
    // `applyAccept: false` : on teste le contrôle applicatif, pas le filtre du navigateur.
    const user = userEvent.setup({ applyAccept: false });
    renderPicker(null);

    await user.click(screen.getByRole('button', { name: /choisir un média/i }));
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/téléverser/i), file);

    expect(await screen.findByText('Ce format de fichier n’est pas autorisé.')).toBeInTheDocument();
    expect(screen.getByTestId('state').textContent).toBe('vide');
  });

  it('téléverse une image acceptée et la sélectionne', async () => {
    const user = userEvent.setup();
    renderPicker(null);

    await user.click(screen.getByRole('button', { name: /choisir un média/i }));
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'nouveau-visuel.png', {
      type: 'image/png',
    });
    await user.upload(screen.getByLabelText(/téléverser/i), file);

    // Le mock valide le type et enregistre le média ; il est sélectionné d'office.
    expect(await screen.findByText('nouveau-visuel.png', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByTestId('state').textContent?.split('|')[0]).toMatch(/^eeeeeeee-/);
  });
});
