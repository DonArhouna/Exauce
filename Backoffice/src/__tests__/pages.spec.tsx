import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMockBackend } from '@/services/api/mock/db';
import { findPage } from '@/services/api/mock/pages';
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

  it('édite les blocs d’accueil et limite les grilles au titre et à l’introduction', async () => {
    const user = userEvent.setup();
    const main = await openPage(
      `/pages/${HOME_ID}`,
      'fondateur@exauceac.com',
      'exauce-fondateur-2026',
    );

    const sections = await within(main).findAllByTestId(/^section-/);
    const [, trustBar, about, domains, audit] = sections;

    // Barre de confiance : liste d'éléments éditable, FR et EN.
    expect(within(trustBar).getByText('Barre de confiance')).toBeInTheDocument();
    const trustItems = within(trustBar).getAllByLabelText(/^Texte/);
    // 3 éléments, chacun rendu en FR et en EN.
    expect(trustItems).toHaveLength(6);
    expect((trustItems[0] as HTMLInputElement).value).toBe('Experts-comptables');
    expect((trustItems[3] as HTMLInputElement).value).toBe('Chartered accountants');

    // À propos : texte et libellé de bouton préremplis.
    expect((within(about).getAllByLabelText(/^Titre/)[0] as HTMLInputElement).value).toBe(
      'Un cabinet de proximité',
    );
    expect((within(about).getAllByLabelText(/^Libellé du bouton/)[0] as HTMLInputElement).value).toBe(
      'En savoir plus',
    );

    // Grilles : titre et introduction seulement, pas de sur-titre.
    expect(within(domains).getAllByLabelText(/^Introduction/)).toHaveLength(2);
    expect(within(domains).queryByLabelText(/^Sur-titre/)).toBeNull();
    expect((within(audit).getAllByLabelText(/^Introduction/)[0] as HTMLTextAreaElement).value).toBe(
      'Une démarche rigoureuse et documentée.',
    );

    // L'enregistrement persiste la modification côté serveur.
    const title = within(about).getAllByLabelText(/^Titre/) [0] as HTMLInputElement;
    await user.clear(title);
    await user.type(title, 'Un cabinet de terrain');
    await user.click(within(about).getByRole('button', { name: /enregistrer le bloc/i }));

    await waitFor(() => {
      const page = findPage(HOME_ID);
      const section = page?.sections.find((entry) => entry.section_type === 'about_preview');
      expect(section?.data?.fr?.title).toBe('Un cabinet de terrain');
      // Les autres langues et les grilles restent intactes.
      expect(section?.data?.en?.title).toBe('A nearby firm');
    });
  });
});
