/**
 * Integration tests for the home page
 */
import { render, screen } from '@testing-library/react';
import { AddPostForm } from '~/components/AddPostForm';

// Mock Next.js router for client components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe('HomePage Components', () => {
  it('should render the AddPostForm component', () => {
    render(<AddPostForm />);

    expect(screen.getByText('Add a New Post')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter post title')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter post content'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Post/i }),
    ).toBeInTheDocument();
  });
});
