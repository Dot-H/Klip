/**
 * Integration tests for the post detail page
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { notFound } from 'next/navigation';
import PostViewPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useParams: jest.fn(() => ({ id: '1' })),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe('PostViewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render post details when post is found', async () => {
    const mockPost = {
      id: '1',
      title: 'Test Post',
      text: 'Test content',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPost,
    } as Response);

    await act(async () => {
      render(<PostViewPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/posts/1');
  });

  it('should call notFound when post is not found', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      ok: false,
    } as Response);

    await act(async () => {
      render(<PostViewPage />);
    });

    await waitFor(() => {
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  it('should display error when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    await act(async () => {
      render(<PostViewPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
});
