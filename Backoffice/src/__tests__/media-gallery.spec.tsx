import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaGallery } from '@/components/media';
import type { GalleryItem } from '@/lib/media';

function item(index: number, alt: string): GalleryItem {
  return {
    key: `item-${index}`,
    id: `eeeeeeee-000${index}-4001-8001-00000000000${index}`,
    name: `photo-${index}.jpg`,
    kind: 'image',
    url: 'data:image/svg+xml;utf8,%3Csvg%2F%3E',
    mime: 'image/jpeg',
    alt: { fr: alt, en: alt },
    decorative: false,
  };
}

function Harness({ initial }: { initial: GalleryItem[] }) {
  const [items, setItems] = useState(initial);
  return (
    <>
      <MediaGallery label="Galerie de la section" items={items} onChange={setItems} />
      <div data-testid="order">{items.map((entry) => entry.key).join(',')}</div>
    </>
  );
}

const three = [item(1, 'Un'), item(2, 'Deux'), item(3, 'Trois')];

describe('MediaGallery', () => {
  it('déplace un média vers le haut et le bas au clavier', async () => {
    const user = userEvent.setup();
    render(<Harness initial={three} />);

    await user.click(screen.getByRole('button', { name: /descendre le média 1/i }));
    expect(screen.getByTestId('order').textContent).toBe('item-2,item-1,item-3');
    expect(screen.getByRole('status')).toHaveTextContent('Média déplacé en position 2 sur 3.');

    await user.click(screen.getByRole('button', { name: /monter le média 3/i }));
    expect(screen.getByTestId('order').textContent).toBe('item-2,item-3,item-1');
  });

  it('désactive les déplacements impossibles en début et fin de liste', () => {
    render(<Harness initial={three} />);

    expect(screen.getByRole('button', { name: /monter le média 1/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /descendre le média 3/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /descendre le média 1/i })).toBeEnabled();
  });

  it('signale les médias sans texte alternatif et permet de les retirer', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={[
          item(1, 'Un'),
          { ...item(2, 'Deux'), alt: {} },
        ]}
      />,
    );

    expect(screen.getByText(/1 média\(s\) sans texte alternatif bloquent la publication/i)).toBeInTheDocument();

    const list = screen.getByRole('list');
    await user.click(within(list).getByRole('button', { name: /retirer le média 2/i }));
    expect(screen.getByTestId('order').textContent).toBe('item-1');
    expect(screen.queryByText(/bloquent la publication/i)).not.toBeInTheDocument();
  });
});
