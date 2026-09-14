import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import { AuthProvider } from '../../context/AuthContext';
import { describe, it, expect } from 'vitest';

describe('Login Component', () => {
  it('renders login form and Aurelia brand heading', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Sign in to Aurelia')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
  });
});
