import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/router';

/** Rend l'application complète sur un chemin donné (routeur mémoire). */
export function renderApp(path = '/connexion') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
}

/** Se connecte avec les champs du formulaire de connexion. */
export async function signIn(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/adresse e-mail/i), email);
  await user.type(screen.getByLabelText(/^mot de passe/i), password);
  await user.click(screen.getByRole('button', { name: /se connecter/i }));
  return user;
}
