import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMockBackend } from '@/services/api/mock/db';
import { renderApp, signIn } from './harness';

const HOME_ID = 'aaaaaaaa-0001-4001-8001-000000000001';
const LEGAL_ID = 'aaaaaaaa-0008-4001-8001-000000000008';

async function openPage(path: string, email: string, password: string) {
  renderApp(path);
  await signIn(email, password);
  return screen.findByRole('main');
}

describe('pages et sections', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('liste les 10 pages du seed et distingue la navigation', async () => {
    const main = await openPage('/pages', 'fondateur@exauceac.com', 'exauce-fondateur-2026');

    expect(
      await within(main).findByRole('heading', { name: /pages et sections/i }),
    ).toBeInTheDocument();

    const rows = within(main).getAllByRole('row');
    // En-tête + 10 pages.
    expect(rows).toHaveLength(11);
    expect(within(main).getByRole('link', { name: 'Secteurs' })).toBeInTheDocument();
    // 7 pages en navigation, 3 hors navigation.
    expect(within(main).getAllByText(/^Navigation · /)).toHaveLength(7);
    expect(within(main).getAllByText('Hors navigation')).toHaveLength(3);
  });

  it('édite une page : blocs ordonnés et champs FR/EN préremplis', async () => {
    const main = await openPage(
      `/pages/${HOME_ID}`,
      'fondateur@exauceac.com',
      'exauce-fondateur-2026',
    );

    expect(await within(main).findByRole('heading', { name: 'Accueil' })).toBeInTheDocument();
    expect(within(main).getByText('Blocs (10)')).toBeInTheDocument();

    const sections = within(main).getAllByTestId(/^section-/);
    expect(sections).toHaveLength(10);
    expect(within(sections[0]).getByText('En-tête d’accueil')).toBeInTheDocument();

    const subtitles = within(sections[0]).getAllByLabelText(/sous-titre/i);
    expect(subtitles).toHaveLength(2);
    expect((subtitles[0] as HTMLTextAreaElement).value).toContain('Comptabilité');
    expect((subtitles[1] as HTMLTextAreaElement).value).toContain('Accounting');
  });

  it('affiche la colonne EN en lecture seule pour un rédacteur limité au français', async () => {
    const main = await openPage(
      `/pages/${HOME_ID}`,
      'redacteur-fr@exauceac.com',
      'exauce-redacteur-fr-2026',
    );

    const sections = await within(main).findAllByTestId(/^section-/);
    const hero = sections[0];
    const enColumn = within(hero).getByRole('region', { name: 'Contenu EN' });
    const frColumn = within(hero).getByRole('region', { name: 'Contenu FR' });

    expect((within(enColumn).getAllByLabelText(/sous-titre/i)[0] as HTMLTextAreaElement).disabled).toBe(
      true,
    );
    expect((within(frColumn).getAllByLabelText(/sous-titre/i)[0] as HTMLTextAreaElement).disabled).toBe(
      false,
    );
    expect(
      within(enColumn).getByText(/langue non autorisée pour ce compte/i),
    ).toBeInTheDocument();
  });

  it('soumet une page en relecture puis refuse l’auto-approbation', async () => {
    const user = userEvent.setup();
    const main = await openPage(
      `/pages/${LEGAL_ID}`,
      'fondateur@exauceac.com',
      'exauce-fondateur-2026',
    );

    expect(await within(main).findByText(/bandeaux en attente/i)).toBeInTheDocument();

    await user.click(within(main).getByRole('button', { name: /soumettre à relecture/i }));

    expect(await within(main).findByText('En relecture')).toBeInTheDocument();
    await user.click(within(main).getByRole('button', { name: /^approuver$/i }));

    expect(
      await within(main).findByText(/vous ne pouvez pas approuver votre propre soumission/i),
    ).toBeInTheDocument();
  });

  it('réordonne un bloc avec les boutons clavier et valide les champs obligatoires', async () => {
    const user = userEvent.setup();
    const main = await openPage(
      `/pages/${HOME_ID}`,
      'fondateur@exauceac.com',
      'exauce-fondateur-2026',
    );

    const sections = await within(main).findAllByTestId(/^section-/);
    await user.click(within(sections[0]).getByRole('button', { name: /descendre/i }));

    await waitFor(() => {
      const updated = within(main).getAllByTestId(/^section-/);
      expect(within(updated[0]).getByText('Barre de confiance')).toBeInTheDocument();
    });

    // Le bloc d'en-tête est désormais en deuxième position : vider un champ
    // obligatoire bloque l'enregistrement côté client.
    const hero = within(main)
      .getAllByTestId(/^section-/)
      .find((section) => within(section).queryByText('En-tête d’accueil')) as HTMLElement;
    const frSubtitle = within(hero).getAllByLabelText(/sous-titre/i)[0];
    await user.clear(frSubtitle);
    await user.click(within(hero).getByRole('button', { name: /enregistrer le bloc/i }));

    expect(await within(hero).findByText('Champ obligatoire')).toBeInTheDocument();
  });
});
