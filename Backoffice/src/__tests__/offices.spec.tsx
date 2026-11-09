import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { findAccountByEmail, resetMockBackend } from '@/services/api/mock/db';
import { listOffices } from '@/services/api/mock/offices';
import { mockRequest } from '@/services/api/mock/backend';
import { renderApp, signIn } from './harness';

async function openOffices(email = 'admin@exauceac.com', password = 'exauce-admin-2026') {
  renderApp('/bureaux');
  await signIn(email, password);
  const main = await screen.findByRole('main');
  await within(main).findByRole('table');
  return main;
}

function officeRow(main: HTMLElement, name: string): HTMLElement {
  return within(main).getByText(name).closest('tr') as HTMLElement;
}

describe('bureaux', () => {
  beforeEach(() => {
    resetMockBackend();
  });

  it('liste les bureaux dans l’ordre et distingue le siège', async () => {
    const main = await openOffices();

    expect(within(main).getByRole('heading', { name: 'Bureaux' })).toBeInTheDocument();
    // En-tête + 3 bureaux.
    expect(within(main).getAllByRole('row')).toHaveLength(4);

    const rows = within(main).getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Siège d’Abidjan')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Siège')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Bureau de Bouaké')).toBeInTheDocument();
    expect(within(rows[2]).queryByText('Siège')).toBeNull();
  });

  it('crée un bureau bilingue', async () => {
    const user = userEvent.setup();
    const main = await openOffices();

    await user.click(within(main).getByRole('button', { name: /nouveau bureau/i }));
    const dialog = await screen.findByRole('dialog');

    const field = (id: string) => dialog.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;
    await user.type(field('office-code'), 'DLO');
    await user.type(field('office-name-fr'), 'Bureau de Daloa');
    await user.type(field('office-city-fr'), 'Daloa');
    await user.click(within(dialog).getByRole('button', { name: /^enregistrer$/i }));

    expect(await within(main).findByText('Bureau de Daloa')).toBeInTheDocument();
    const created = listOffices().find((office) => office.code === 'DLO');
    expect(created?.translations.fr.city).toBe('Daloa');
    // Sans traduction anglaise, le français sert de repli.
    expect(created?.translations.en.name).toBe('Bureau de Daloa');
    expect(created?.is_active).toBe(true);
  });

  it('refuse un code déjà utilisé', async () => {
    const user = userEvent.setup();
    const main = await openOffices();

    await user.click(within(main).getByRole('button', { name: /nouveau bureau/i }));
    const dialog = await screen.findByRole('dialog');
    const field = (id: string) => dialog.querySelector<HTMLInputElement>(`#${id}`) as HTMLInputElement;
    await user.type(field('office-code'), 'ABJ');
    await user.type(field('office-name-fr'), 'Doublon');
    await user.type(field('office-city-fr'), 'Abidjan');
    await user.click(within(dialog).getByRole('button', { name: /^enregistrer$/i }));

    expect(await within(dialog).findByText(/déjà utilisé/i)).toBeInTheDocument();
    expect(listOffices()).toHaveLength(3);
  });

  it('transfère le siège à un autre bureau', async () => {
    const user = userEvent.setup();
    const main = await openOffices();

    await user.click(within(officeRow(main, 'Bureau de Yamoussoukro')).getByRole('button', { name: /^modifier$/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByLabelText(/définir comme siège/i));
    await user.click(within(dialog).getByRole('button', { name: /^enregistrer$/i }));

    await waitFor(() => {
      const offices = listOffices();
      expect(offices.filter((office) => office.is_headquarters)).toHaveLength(1);
      expect(offices.find((office) => office.is_headquarters)?.code).toBe('YAM');
    });
    const abidjan = officeRow(main, 'Siège d’Abidjan');
    expect(within(abidjan).queryByText('Siège')).toBeNull();
  });

  it('supprime un bureau mais refuse de supprimer le siège', async () => {
    const user = userEvent.setup();
    const main = await openOffices();

    await user.click(
      within(officeRow(main, 'Bureau de Bouaké')).getByRole('button', { name: /supprimer bureau de bouaké/i }),
    );
    await user.click(await screen.findByRole('button', { name: /^supprimer$/i }));

    await waitFor(() => expect(listOffices()).toHaveLength(2));
    expect(within(main).queryByText('Bureau de Bouaké')).toBeNull();

    await user.click(
      within(officeRow(main, 'Siège d’Abidjan')).getByRole('button', { name: /supprimer siège d’abidjan/i }),
    );
    await user.click(await screen.findByRole('button', { name: /^supprimer$/i }));

    expect(await screen.findByText(/désignez un autre siège/i)).toBeInTheDocument();
    expect(listOffices()).toHaveLength(2);
  });

  it('refuse l’écran à un compte sans offices:view', async () => {
    renderApp('/bureaux');
    await signIn('lecteur@exauceac.com', 'exauce-lecteur-2026');
    const main = await screen.findByRole('main');

    expect(await within(main).findByText(/accès refusé/i)).toBeInTheDocument();
  });

  it('renvoie 403 côté serveur sans offices:edit', async () => {
    renderApp('/bureaux');
    await signIn('admin@exauceac.com', 'exauce-admin-2026');
    const main = await screen.findByRole('main');
    await within(main).findByRole('table');

    const account = findAccountByEmail('admin@exauceac.com');
    if (!account) throw new Error('compte admin introuvable');
    const saved = account.user.permissions;
    account.user.permissions = saved.filter(
      (permission) => permission.module !== 'offices' || permission.action === 'view',
    );
    const target = listOffices()[1];
    const response = await mockRequest({
      method: 'PATCH',
      path: `/admin/offices/${target.id}`,
      body: { code: target.code, translations: target.translations },
      query: {},
      csrfToken: null,
    });
    account.user.permissions = saved;

    expect(response.status).toBe(403);
  });
});
