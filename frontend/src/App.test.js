// import { render, screen } from '@testing-library/react';
// import App from './App';

// test('renders learn react link', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app brand name', () => {
  render(<App />);
  const brandElement = screen.getByText(/ULPVMS/i);
  expect(brandElement).toBeInTheDocument();
});