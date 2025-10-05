/**
 * Integration tests for the post detail page
 */
import { render, screen } from '@testing-library/react';
import { PostItem } from '../page';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('PostViewPage Components', () => {
  it('should render post details', () => {
    const mockPost = {
      id: '1',
      title: 'Test Post',
      text: 'Test content',
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    };

    render(<PostItem post={mockPost} />);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Created 1/1/2023')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
