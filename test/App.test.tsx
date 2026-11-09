import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('shows the main nav links', () => {
  render(<App />);
  for (const name of ['Today', 'Review', 'Stories', 'Settings']) {
    expect(screen.getByRole('link', { name })).toBeInTheDocument();
  }
});
