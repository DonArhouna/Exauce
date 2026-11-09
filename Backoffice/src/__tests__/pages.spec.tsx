import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMockBackend } from '@/services/api/mock/db';
import { findPage, listPages } from '@/services/api/mock/pages';
import { patchPageContent, patchPageSeo } from '@/services/api/endpoints/pages';
import { renderApp, signIn } from './harness';

const HOME_ID = 'aaaaaaaa-0001-4001-8001-000000000001';
const SERVICES_ID = 'aaaaaaaa-0002-4001-8001-000000000002';
const LEGAL_ID = 'aaaaaaaa-0009-4001-8001-000000000009';
const ABOUT_ID = 'aaaaaaaa-0007-4001-8001-000000000007';

async function openPage(path: string, email: string, password: string) {
  renderApp(path);
  await signIn(email, password);
  return screen.findByRole('main');
}

describe('pages et sections', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('liste les 11 pages du site et distingue la navigation', async () => {
    const main = await openPage('/pages', 'fondateur@exauceac.com', 'exauce-fondateur-2026');

    expect(
      await within(main).findByRole('heading', { name: /pages et sections/i }),
    ).toBeInTheDocument();

    const rows = within(main).getAllByRole('row');
    // En-tête + 11 pages.
    expect(rows).toHaveLength(12);
    expect(within(main).getByRole('link', { name: 'Secteurs' })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Nos partenaires' })).toBeInTheDocument();
    // 8 pages en navigation, 3 hors navigation.
    expect(within(main).getAllByText(/^Navigation · /)).toHaveLength(8);
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
    expect((subtitles[0] as HTMLTextAreaElement).value).toContain('solutionner leurs problèmes');
    expect((subtitles[1] as HTMLTextAreaElement).value).toContain('most complex problems');
  });

  it('édite les champs de page et SEO par langue depuis le panneau Page', async () => {
    const user = userEvent.setup();
    const main = await openPage(
      `/pages/${SERVICES_ID}`,
      'fondateur@exauceac.com',
      'exauce-fondateur-2026',
    );
    const panel = await within(main).findByTestId('page-panel');
    const frColumn = within(panel).getByRole('region', { name: 'Contenu FR' });
    const enColumn = within(panel).getByRole('region', { name: 'Contenu EN' });

    const title = within(frColumn).getByLabelText('Titre de la page') as HTMLInputElement;
    const navLabel = within(frColumn).getByLabelText('Libellé de navigation') as HTMLInputElement;
    const intro = within(frColumn).getByLabelText('Introduction') as HTMLTextAreaElement;
    const seoTitle = within(frColumn).getByLabelText('Titre SEO') as HTMLInputElement;
    const seoDescription = within(frColumn).getByLabelText('Description SEO') as HTMLTextAreaElement;

    expect(title.value).toBe('Deux grandes familles, une même exigence');
    expect(navLabel.value).toBe('Services');
    expect(intro.value).toContain('focalisation totale');
    expect(seoTitle.placeholder).toBe(
      'Repli Frontend actuel : Services — EXAUCE Audit & Conseils',
    );
    expect(seoDescription.placeholder).toBe(
      'Repli Frontend actuel : Services — EXAUCE Audit & Conseils',
    );

    await user.clear(title);
    await user.type(title, 'Nos services d’audit');
    await user.clear(navLabel);
    await user.type(navLabel, 'Conseil et audit');
    await user.clear(seoTitle);
    await user.type(seoTitle, 'Services — EXAUCE');
    await user.clear(seoDescription);
    await user.type(seoDescription, 'Conseil et audit à Dakar.');
    await user.click(within(frColumn).getByRole('button', { name: 'Enregistrer FR' }));

    await waitFor(() => {
      const page = findPage(SERVICES_ID)!;
      expect(page.title.fr).toBe('Nos services d’audit');
      expect(page.nav_label.fr).toBe('Conseil et audit');
      expect(page.seo_title.fr).toBe('Services — EXAUCE');
      expect(page.seo_description.fr).toBe('Conseil et audit à Dakar.');
    });
    expect((within(enColumn).getByLabelText('Titre de la page') as HTMLInputElement).value).toBe(
      'Two great families, one standard of excellence',
    );
    expect(findPage(SERVICES_ID)?.intro.en).toContain('total focus on their skills');
  });

  it('édite modes en FR/EN, préserve les champs inconnus et conserve l’ordre explicite', async () => {
    const user = userEvent.setup();
    const page = findPage(SERVICES_ID)!;
    const modes = page.sections.find((section) => section.section_type === 'modes')!;
    const frItems = modes.data.fr.items as Record<string, unknown>[];
    frItems[0].source_reference = 'à conserver';
    modes.data.fr.unknown_source_field = 'valeur inconnue conservée';

    const main = await openPage(
      `/pages/${SERVICES_ID}`,
      'fondateur@exauceac.com',
      'exauce-fondateur-2026',
    );
    const modesCard = await within(main).findByTestId(`section-${modes.id}`);
    const modesList = within(modesCard).getAllByRole('group', { name: 'Modes d’accompagnement' })[0];
    await user.click(within(modesList).getByRole('button', { name: 'Déplacer l’élément 1 vers le bas' }));

    const titleInputs = () =>
      Array.from(modesCard.querySelectorAll<HTMLInputElement>('input[id*="-items-"][id$="-title"]'));
    let titles = titleInputs();
    expect(titles.slice(0, 3).map((input) => input.value)).toEqual(['Conseil', 'Assistance', 'Formation']);

    const rows = within(modesList).getAllByRole('listitem');
    const dataTransfer = { effectAllowed: '', setData: vi.fn() };
    fireEvent.dragStart(rows[2], { dataTransfer });
    fireEvent.dragOver(rows[0], { dataTransfer });
    fireEvent.drop(rows[0], { dataTransfer });
    titles = titleInputs();
    expect(titles.slice(0, 3).map((input) => input.value)).toEqual(['Formation', 'Conseil', 'Assistance']);

    await user.clear(titles[0]);
    await user.type(titles[0], 'Formation professionnelle');
    const descriptions = Array.from(
      modesCard.querySelectorAll<HTMLTextAreaElement>('textarea[id*="-items-"][id$="-text"]'),
    );
    await user.clear(descriptions[5]);
    await user.type(descriptions[5], 'Training description updated');
    await user.click(within(modesCard).getByRole('button', { name: 'Enregistrer le bloc' }));

    await waitFor(() => {
      const saved = findPage(SERVICES_ID)!.sections.find((section) => section.id === modes.id)!;
      const savedFr = saved.data.fr;
      const savedEn = saved.data.en;
      const savedFrItems = savedFr.items as Record<string, unknown>[];
      const savedEnItems = savedEn.items as Record<string, unknown>[];
      expect(savedFrItems).toHaveLength(3);
      expect(savedEnItems).toHaveLength(3);
      expect(savedFrItems.map((item) => item.title)).toEqual([
        'Formation professionnelle',
        'Conseil',
        'Assistance',
      ]);
      expect(savedEnItems.map((item) => item.title)).toEqual(['Assistance', 'Advice', 'Training']);
      expect(savedEnItems[2].text).toBe('Training description updated');
      expect(savedFrItems[2].source_reference).toBe('à conserver');
      expect(savedFr.unknown_source_field).toBe('valeur inconnue conservée');
      expect(savedFr.title).toBe("Trois modes d'accompagnement");
      expect(savedEn.title).toBe('Three modes of support');
    });

    const previewSection = await within(main).findByTestId(`preview-section-${modes.id}`);
    expect(within(previewSection).getByRole('heading', { name: "Trois modes d'accompagnement" })).toBeInTheDocument();
    expect(
      within(previewSection)
        .getAllByRole('listitem')
        .map((item) => item.querySelector('p')?.textContent),
    ).toEqual([
      'Formation professionnelle',
      'Conseil',
      'Assistance',
    ]);
  });

  it('verrouille les colonnes selon les permissions de contenu et de SEO', async () => {
    const main = await openPage(
      `/pages/${SERVICES_ID}`,
      'redacteur-fr@exauceac.com',
      'exauce-redacteur-fr-2026',
    );
    const panel = await within(main).findByTestId('page-panel');
    const frColumn = within(panel).getByRole('region', { name: 'Contenu FR' });
    const enColumn = within(panel).getByRole('region', { name: 'Contenu EN' });

    expect(within(frColumn).getByLabelText('Titre de la page')).toBeEnabled();
    expect(within(enColumn).getByLabelText('Titre de la page')).toBeDisabled();
    expect(within(enColumn).getByText('Votre rôle ne permet pas de modifier le contenu de cette langue.'));
    expect(within(frColumn).getByLabelText('Titre SEO')).toBeDisabled();
    expect(within(enColumn).getByLabelText('Titre SEO')).toBeDisabled();
    expect(within(frColumn).getByText('Votre rôle ne permet pas de modifier le SEO dans cette langue.'));

    const page = findPage(SERVICES_ID)!;
    await expect(
      patchPageContent(SERVICES_ID, 'en', { revision: page.revision, nav_label: 'Unauthorized' }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      patchPageSeo(SERVICES_ID, 'fr', { revision: page.revision, seo_title: 'Unauthorized' }),
    ).rejects.toMatchObject({ status: 403 });
    expect(findPage(SERVICES_ID)?.nav_label.en).toBe('Services');
    expect(findPage(SERVICES_ID)?.seo_title.fr).toBe('Services — EXAUCE Audit & Conseils');
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
    expect(findPage(LEGAL_ID)?.page_key).toBe('legal_notice');
    const clientAreaSummary = listPages().find((page) => page.page_key === 'client_area');
    const clientArea = clientAreaSummary ? findPage(clientAreaSummary.id) : undefined;
    expect(clientArea?.page_key).toBe('client_area');
    expect(clientArea?.banners_pending).toBe(false);

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

  it('édite les blocs d’accueil : sur-titres des grilles et contenus réels', async () => {
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
    // 4 éléments, chacun rendu en FR et en EN.
    expect(trustItems).toHaveLength(8);
    expect((trustItems[0] as HTMLInputElement).value).toBe("Inscrite à l'ONECCA du Sénégal");
    expect((trustItems[4] as HTMLInputElement).value).toBe('Registered with the ONECCA of Senegal');

    // À propos : texte et libellé de bouton préremplis.
    expect((within(about).getAllByLabelText(/^Titre/)[0] as HTMLInputElement).value).toBe(
      'Un cabinet créé et dirigé par un expert-comptable',
    );
    expect((within(about).getAllByLabelText(/^Libellé du bouton/)[0] as HTMLInputElement).value).toBe(
      'Découvrir le cabinet',
    );

    // Grilles : sur-titre et titre ; seule la grille audit garde une introduction.
    expect(within(domains).getAllByLabelText(/^Sur-titre/)).toHaveLength(2);
    expect((within(domains).getAllByLabelText(/^Sur-titre/)[0] as HTMLInputElement).value).toBe(
      'Accompagnement',
    );
    expect(within(domains).queryByLabelText(/^Introduction/)).toBeNull();
    expect((within(audit).getAllByLabelText(/^Introduction/)[0] as HTMLTextAreaElement).value).toBe(
      "La prise en main des besoins de certitude des clients, aboutissant à l'émission d'une opinion motivée, positive ou négative, sur un aspect de la gestion, selon un périmètre défini par les textes ou par le client lui-même.",
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
      expect(section?.data?.en?.title).toBe('A firm founded and led by a chartered accountant');
    });
  });

  it('édite what_we_do dans les deux langues et prévisualise sa hiérarchie', async () => {
    const user = userEvent.setup();
    const main = await openPage(`/pages/${ABOUT_ID}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const sections = await within(main).findAllByTestId(/^section-/);
    const whatWeDo = sections.find((section) => within(section).queryByText('what_we_do'))!;
    const textboxes = within(whatWeDo).getAllByRole('textbox');
    const kickerInputs = [textboxes[0], textboxes[2]];
    const textareas = [textboxes[1], textboxes[3]];
    expect((kickerInputs[0] as HTMLInputElement).value).toBe('Ce que nous faisons');
    expect((kickerInputs[1] as HTMLInputElement).value).toBe('What we do');
    expect((textareas[0] as HTMLTextAreaElement).value).toContain('technologies du numérique');
    expect((textareas[1] as HTMLTextAreaElement).value).toContain('digital technologies');

    await user.clear(kickerInputs[0]);
    await user.type(kickerInputs[0], 'Nos activités');
    await user.clear(textareas[1]);
    await user.type(textareas[1], 'Bilingual round trip');
    await user.click(within(whatWeDo).getByRole('button', { name: /enregistrer le bloc/i }));

    await waitFor(() => {
      const saved = findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'what_we_do')!;
      expect(saved.data.fr.kicker).toBe('Nos activités');
      expect(saved.data.fr.text).toContain('technologies du numérique');
      expect(saved.data.en.kicker).toBe('What we do');
      expect(saved.data.en.text).toBe('Bilingual round trip');
    });
    const previewSection = within(main).getByTestId(`preview-section-${findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'what_we_do')!.id}`);
    expect(within(previewSection).getByText('Nos activités')).toBeInTheDocument();
    expect(within(previewSection).getByText(/Tous basés sur les technologies du numérique/)).toBeInTheDocument();
  });

  it('édite founder_card dans les deux langues et prévisualise la carte réelle', async () => {
    const user = userEvent.setup();
    const main = await openPage(`/pages/${ABOUT_ID}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const sections = await within(main).findAllByTestId(/^section-/);
    const founder = sections.find((section) => within(section).queryByText('founder_card'))!;
    const textboxes = within(founder).getAllByRole('textbox');
    expect(textboxes).toHaveLength(8);
    expect((textboxes[0] as HTMLInputElement).value).toBe('Assane KANE');
    expect((textboxes[1] as HTMLInputElement).value).toContain('Fondateur');
    expect((textboxes[4] as HTMLInputElement).value).toBe('Assane KANE');
    expect((textboxes[7] as HTMLTextAreaElement).value).toContain('Detailed founder biography');

    await user.clear(textboxes[0]);
    await user.type(textboxes[0], 'Assane Kane');
    await user.clear(textboxes[7]);
    await user.type(textboxes[7], 'Biography copy to confirm');
    await user.click(within(founder).getByRole('button', { name: /enregistrer le bloc/i }));

    await waitFor(() => {
      const saved = findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'founder_card')!;
      expect(saved.data.fr.name).toBe('Assane Kane');
      expect(saved.data.fr.role).toContain('Fondateur');
      expect(saved.data.en.name).toBe('Assane KANE');
      expect(saved.data.en.empty_text).toBe('Biography copy to confirm');
    });
    const previewSection = within(main).getByTestId(`preview-section-${findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'founder_card')!.id}`);
    expect(within(previewSection).getByText('Assane Kane')).toBeInTheDocument();
    expect(within(previewSection).getByText(/Expert-Comptable et Financier/)).toBeInTheDocument();
  });

  it('réordonne steps au clavier et à la souris, sans perdre les cartes en FR/EN', async () => {
    const user = userEvent.setup();
    const main = await openPage(`/pages/${ABOUT_ID}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const sections = await within(main).findAllByTestId(/^section-/);
    const steps = sections.find((section) => within(section).queryByText('steps'))!;
    const lists = within(steps).getAllByRole('group', { name: 'Étapes de travail' });
    expect(lists).toHaveLength(2);
    const frList = lists[0];
    const enList = lists[1];
    await user.click(within(frList).getByRole('button', { name: 'Déplacer l’élément 1 vers le bas' }));

    const enRows = within(enList).getAllByRole('listitem');
    const dataTransfer = { effectAllowed: '', setData: vi.fn() };
    fireEvent.dragStart(enRows[2], { dataTransfer });
    fireEvent.dragOver(enRows[0], { dataTransfer });
    fireEvent.drop(enRows[0], { dataTransfer });

    await user.click(within(steps).getByRole('button', { name: 'Enregistrer le bloc' }));
    await waitFor(() => {
      const saved = findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'steps')!;
      const frItems = saved.data.fr.items as Record<string, string>[];
      const enItems = saved.data.en.items as Record<string, string>[];
      expect(frItems).toHaveLength(3);
      expect(frItems.map((item) => item.title)).toEqual([
        'Pilotes par vos savoir-faire', 'Un cheminement pas à pas', "Toutes les formes d'organisation",
      ]);
      expect(enItems).toHaveLength(3);
      expect(enItems.map((item) => item.title)).toEqual([
        'Every kind of organization', 'A step-by-step path', 'Driven by your know-how',
      ]);
    });
    const stepsId = findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'steps')!.id;
    const preview = within(main).getByTestId(`preview-section-${stepsId}`);
    expect(within(preview).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Pilotes par vos savoir-faire'),
      expect.stringContaining('Un cheminement pas à pas'),
      expect.stringContaining("Toutes les formes d'organisation"),
    ]);
  });

  it('édite values_grid dans les deux langues et prévisualise le texte à confirmer', async () => {
    const user = userEvent.setup();
    const main = await openPage(`/pages/${ABOUT_ID}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const sections = await within(main).findAllByTestId(/^section-/);
    const values = sections.find((section) => within(section).queryByText('values_grid'))!;
    const inputs = within(values).getAllByRole('textbox');
    expect(inputs).toHaveLength(4);
    expect((inputs[0] as HTMLInputElement).value).toBe('Valeurs du cabinet');
    expect((inputs[2] as HTMLInputElement).value).toBe('Our values');
    expect((inputs[3] as HTMLTextAreaElement).value).toContain('to be validated by the firm');

    await user.clear(inputs[0]);
    await user.type(inputs[0], 'Nos engagements');
    await user.clear(inputs[3]);
    await user.type(inputs[3], 'Values wording — firm confirmation required.');
    await user.click(within(values).getByRole('button', { name: 'Enregistrer le bloc' }));

    await waitFor(() => {
      const saved = findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'values_grid')!;
      expect(saved.data.fr.title).toBe('Nos engagements');
      expect(saved.data.fr.empty_text).toContain('à valider par le cabinet');
      expect(saved.data.en.title).toBe('Our values');
      expect(saved.data.en.empty_text).toBe('Values wording — firm confirmation required.');
    });
    const valuesId = findPage(ABOUT_ID)!.sections.find((section) => section.section_type === 'values_grid')!.id;
    const preview = within(main).getByTestId(`preview-section-${valuesId}`);
    expect(within(preview).getByText('Nos engagements')).toBeInTheDocument();
    expect(within(preview).getByText(/à valider par le cabinet/)).toBeInTheDocument();
  });

  it('réordonne le comparatif des interventions et préserve ses valeurs FR/EN', async () => {
    const user = userEvent.setup();
    const id = 'aaaaaaaa-0003-4001-8001-000000000003';
    const main = await openPage(`/pages/${id}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const sections = await within(main).findAllByTestId(/^section-/);
    const compare = sections.find((section) => within(section).queryByText('interventions_compare'))!;
    const groups = within(compare).getAllByRole('group', { name: 'Lignes du comparatif' });
    expect(groups).toHaveLength(2);
    const frRows = within(groups[0]).getAllByRole('listitem');
    await user.click(within(frRows[0]).getByRole('button', { name: 'Déplacer l’élément 1 vers le bas' }));

    const enRows = within(groups[1]).getAllByRole('listitem');
    const dataTransfer = { effectAllowed: '', setData: vi.fn() };
    fireEvent.dragStart(enRows[2], { dataTransfer });
    fireEvent.dragOver(enRows[0], { dataTransfer });
    fireEvent.drop(enRows[0], { dataTransfer });

    const firstFrRecurring = compare.querySelector<HTMLTextAreaElement>('textarea[id*="-fr-rows-0-recurring"]')!;
    const lastEnOneoff = compare.querySelector<HTMLTextAreaElement>('textarea[id*="-en-rows-0-oneoff"]')!;
    await user.clear(firstFrRecurring);
    await user.type(firstFrRecurring, 'Valeur française enregistrée');
    await user.clear(lastEnOneoff);
    await user.type(lastEnOneoff, 'English comparison saved');
    await user.click(within(compare).getByRole('button', { name: 'Enregistrer le bloc' }));

    await waitFor(() => {
      const saved = findPage(id)!.sections.find((section) => section.section_type === 'interventions_compare')!;
      const fr = saved.data.fr.rows as Record<string, string>[];
      const en = saved.data.en.rows as Record<string, string>[];
      expect(fr).toHaveLength(3);
      expect(fr.map((row) => row.label)).toEqual([
        "Ressort de l'intervention", 'Finalité pour le client', 'Ce que nous adorons',
      ]);
      expect(fr[0].recurring).toBe('Valeur française enregistrée');
      expect(en).toHaveLength(3);
      expect(en.map((row) => row.label)).toEqual([
        'What we love', 'Purpose for the client', 'Lever of the intervention',
      ]);
      expect(en[0].oneoff).toBe('English comparison saved');
    });
    const preview = within(main).getByTestId(`preview-section-${findPage(id)!.sections.find((section) => section.section_type === 'interventions_compare')!.id}`);
    expect(within(preview).getAllByRole('row')[1].textContent).toContain("Ressort de l'intervention");
    expect(within(preview).getAllByRole('row')[2].textContent).toContain('Finalité pour le client');
  });

  it('édite contact_form sans dupliquer l’introduction de Page', async () => {
    const user = userEvent.setup();
    const id = 'aaaaaaaa-0008-4001-8001-000000000008';
    const main = await openPage(`/pages/${id}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const pagePanel = await within(main).findByTestId('page-panel');
    const frPage = within(pagePanel).getByRole('region', { name: 'Contenu FR' });
    expect((within(frPage).getByLabelText('Introduction') as HTMLTextAreaElement).value).toBe(
      'Nos implantations et coordonnées directes.',
    );
    const sections = await within(main).findAllByTestId(/^section-/);
    const form = sections.find((section) => within(section).queryByText('contact_form'))!;
    const textareas = within(form).getAllByRole('textbox');
    expect(textareas).toHaveLength(2);
    expect((textareas[0] as HTMLTextAreaElement).value).toContain('Votre message a bien été envoyé');
    expect((textareas[1] as HTMLTextAreaElement).value).toContain('Your message has been sent successfully');

    await user.clear(textareas[0]);
    await user.type(textareas[0], 'Confirmation bilingue — version FR');
    await user.clear(textareas[1]);
    await user.type(textareas[1], 'Bilingual confirmation — EN version');
    await user.click(within(form).getByRole('button', { name: 'Enregistrer le bloc' }));
    await waitFor(() => {
      const saved = findPage(id)!;
      const contactForm = saved.sections.find((section) => section.section_type === 'contact_form')!;
      expect(contactForm.data.fr.success_text).toBe('Confirmation bilingue — version FR');
      expect(contactForm.data.en.success_text).toBe('Bilingual confirmation — EN version');
      expect(saved.intro.fr).toBe('Nos implantations et coordonnées directes.');
    });
    const formId = findPage(id)!.sections.find((section) => section.section_type === 'contact_form')!.id;
    const preview = within(main).getByTestId(`preview-section-${formId}`);
    expect(within(preview).getByText(/Confirmation bilingue — version FR/)).toBeInTheDocument();
  });

  it('édite offices_grid et prévisualise le bureau dans son ordre réel', async () => {
    const user = userEvent.setup();
    const id = 'aaaaaaaa-0008-4001-8001-000000000008';
    const main = await openPage(`/pages/${id}`, 'fondateur@exauceac.com', 'exauce-fondateur-2026');
    const sections = await within(main).findAllByTestId(/^section-/);
    const offices = sections.find((section) => within(section).queryByText('offices_grid'))!;
    const textboxes = within(offices).getAllByRole('textbox');
    expect(textboxes).toHaveLength(8);
    expect((textboxes[0] as HTMLInputElement).value).toBe('Nos implantations');
    expect((textboxes[4] as HTMLInputElement).value).toBe('Our locations');
    expect((textboxes[6] as HTMLTextAreaElement).value).toContain('to be validated by the firm');

    await user.clear(textboxes[0]);
    await user.type(textboxes[0], 'Nos bureaux');
    await user.clear(textboxes[7]);
    await user.type(textboxes[7], 'Map copy ready for firm approval.');
    await user.click(within(offices).getByRole('button', { name: 'Enregistrer le bloc' }));
    await waitFor(() => {
      const saved = findPage(id)!.sections.find((section) => section.section_type === 'offices_grid')!;
      expect(saved.data.fr.title).toBe('Nos bureaux');
      expect(saved.data.fr.intro).toContain('siège à Dakar');
      expect(saved.data.en.title).toBe('Our locations');
      expect(saved.data.en.map_empty_text).toBe('Map copy ready for firm approval.');
    });

    const officesId = findPage(id)!.sections.find((section) => section.section_type === 'offices_grid')!.id;
    const preview = within(main).getByTestId(`preview-section-${officesId}`);
    expect(within(preview).getByText('Nos bureaux')).toBeInTheDocument();
    expect(await within(preview).findByText('Siège — Dakar (Sénégal)')).toBeInTheDocument();
    expect(within(preview).getByText('Dakar', { exact: true })).toBeInTheDocument();
  });
});
