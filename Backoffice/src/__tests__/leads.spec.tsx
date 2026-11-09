import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMockBackend } from '@/services/api/mock/db';
import { renderApp, signIn } from './harness';

async function openLeads(email = 'admin@exauceac.com', password = 'exauce-admin-2026') {
  renderApp('/demandes');
  await signIn(email, password);
  const main = await screen.findByRole('main');
  await within(main).findByRole('table');
  return main;
}

describe('demandes de contact', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('liste les demandes, leurs compteurs et le détail au clic', async () => {
    const main = await openLeads();

    expect(within(main).getByRole('heading', { name: 'Demandes de contact' })).toBeInTheDocument();
    // 12 demandes fictives, en-tête compris dans les lignes du tableau.
    expect(within(main).getAllByRole('row')).toHaveLength(13);
    expect(within(main).getByText('DEM-2026-001')).toBeInTheDocument();

    const user = userEvent.setup();
    const row = within(main).getByText('DEM-2026-001').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Ouvrir' }));

    const panel = await within(main).findByRole('region', { name: /détail de la demande/i });
    expect(await within(panel).findByText(/accompagnement comptable pour une PME/i)).toBeInTheDocument();
    expect(within(panel).getByText('Appeler avant vendredi pour qualifier le besoin.')).toBeInTheDocument();
  });

  it('filtre par statut et par recherche', async () => {
    const main = await openLeads();
    const user = userEvent.setup();

    await user.click(within(main).getByRole('button', { name: /Nouveau/ }));
    await waitFor(() => expect(within(main).getAllByRole('row')).toHaveLength(4));
    expect(within(main).getByText('DEM-2026-011')).toBeInTheDocument();

    await user.click(within(main).getByRole('button', { name: /Toutes/ }));
    await waitFor(() => expect(within(main).getAllByRole('row')).toHaveLength(13));

    await user.type(within(main).getByLabelText('Rechercher'), 'Ndiaye');
    await user.click(within(main).getByRole('button', { name: 'Filtrer' }));

    await waitFor(() => expect(within(main).getAllByRole('row')).toHaveLength(2));
    expect(within(main).getByText('DEM-2026-002')).toBeInTheDocument();
  });

  it('change le statut et ajoute une note interne', async () => {
    const main = await openLeads();
    const user = userEvent.setup();

    await user.click(within(main).getAllByRole('button', { name: 'Ouvrir' })[0]);
    const panel = await within(main).findByRole('region', { name: /détail de la demande/i });

    const status = (await within(panel).findByLabelText(/statut de la demande/i)) as HTMLSelectElement;
    await user.selectOptions(status, 'in_progress');

    await waitFor(() => expect((within(panel).getByLabelText(/statut de la demande/i) as HTMLSelectElement).value).toBe('in_progress'));

    await user.type(within(panel).getByLabelText(/ajouter une note/i), 'Premier contact effectué.');
    await user.click(within(panel).getByRole('button', { name: 'Enregistrer la note' }));

    expect(await within(panel).findByText('Premier contact effectué.')).toBeInTheDocument();
  });

  it('refuse une note vide sans appeler le serveur', async () => {
    const main = await openLeads();
    const user = userEvent.setup();

    const row = within(main).getByText('DEM-2026-001').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Ouvrir' }));
    const panel = await within(main).findByRole('region', { name: /détail de la demande/i });

    await user.click(await within(panel).findByRole('button', { name: 'Enregistrer la note' }));
    expect(await within(panel).findByText('La note ne peut pas être vide.')).toBeInTheDocument();
  });
});
