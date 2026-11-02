import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoField } from '@/components/media';
import type { VideoValue } from '@/lib/media';

const empty: VideoValue = { url: '', caption: {}, transcription: {} };

function Harness({ initial = empty }: { initial?: VideoValue }) {
  const [value, setValue] = useState<VideoValue>(initial);
  return (
    <>
      <VideoField id="presentation" label="Vidéo de présentation" value={value} onChange={setValue} />
      <output data-testid="state">{JSON.stringify(value)}</output>
    </>
  );
}

describe('VideoField', () => {
  it('refuse un lien qui n’est ni YouTube ni Vimeo', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/vidéo de présentation/i), 'https://example.com/video/42');

    expect(screen.getByText(/seuls YouTube et Vimeo sont acceptés/i)).toBeInTheDocument();
    expect(screen.queryByTitle(/aperçu/i)).not.toBeInTheDocument();
  });

  it('accepte un lien YouTube et affiche un aperçu sans cookie', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(
      screen.getByLabelText(/vidéo de présentation/i),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );

    expect(screen.queryByText(/seuls YouTube et Vimeo sont acceptés/i)).not.toBeInTheDocument();
    const frame = screen.getByTitle(/aperçu youtube/i);
    expect(frame).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('accepte un lien Vimeo', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText(/vidéo de présentation/i), 'https://vimeo.com/76979871');

    expect(screen.getByTitle(/aperçu vimeo/i)).toHaveAttribute(
      'src',
      'https://player.vimeo.com/video/76979871',
    );
  });

  it('enregistre la légende et la transcription par langue d’édition', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText('Légende (Français)'), 'Présentation du cabinet');
    await user.type(screen.getByLabelText('Transcription (Français)'), 'Nous accompagnons les PME.');

    const state = JSON.parse(screen.getByTestId('state').textContent ?? '{}') as VideoValue;
    expect(state.caption.fr).toBe('Présentation du cabinet');
    expect(state.transcription.fr).toBe('Nous accompagnons les PME.');
  });
});
