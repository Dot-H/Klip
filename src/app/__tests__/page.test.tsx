/**
 * Integration tests for the home page
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import HomePage from '../page';

// Mock Next.js router
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the welcome message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        nextCursor: null,
      }),
    } as Response);

    await act(async () => {
      render(<HomePage />);
    });

    expect(screen.getByText('Welcome to Klip! 🧗‍♂️')).toBeInTheDocument();
    expect(screen.getByText('Track your climbing routes and maintenance with ease.')).toBeInTheDocument();
  });

  it('should display posts when loaded', async () => {
    const mockPosts = [
      {
        id: '1',
        title: 'Test Post 1',
        text: 'Test content 1',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: mockPosts,
        nextCursor: null,
      }),
    } as Response);

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });
  });

  it('should display error when posts fail to load', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    await act(async () => {
      render(<HomePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
});
