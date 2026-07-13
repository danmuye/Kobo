import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Index from '@/pages/Index';

describe('Index page', () => {
  it('shows the product hero and primary call to action', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /take control of your money/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /open dashboard/i }).length).toBeGreaterThan(0);
    expect(screen.getByText(/track budgets, goals, debts and accounts/i)).toBeInTheDocument();
  });
});
