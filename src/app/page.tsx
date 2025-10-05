'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';

interface Post {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  items: Post[];
  nextCursor: string | null;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingPost, setAddingPost] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Charger les posts initiaux
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/posts?limit=5');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data: PostsResponse = await response.json();
        setPosts(data.items);
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Charger plus de posts
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await fetch(`/api/posts?limit=5&cursor=${nextCursor}`);
      if (!response.ok) {
        throw new Error('Failed to fetch more posts');
      }
      const data: PostsResponse = await response.json();
      setPosts(prev => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingMore(false);
    }
  };

  // Ajouter un nouveau post
  const handleAddPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const text = formData.get('text') as string;

    if (!title || !text) {
      setAddError('Title and content are required');
      return;
    }

    try {
      setAddingPost(true);
      setAddError(null);
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, text }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const newPost: Post = await response.json();
      setPosts(prev => [newPost, ...prev]);
      form.reset();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAddingPost(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header Section */}
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Klip! 🧗‍♂️
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track your climbing routes and maintenance with ease.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Built with Next.js App Router and Material-UI.
        </Typography>
      </Paper>

      {/* Posts Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h2">
            Latest Posts
            {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
          </Typography>
          <Button
            variant="outlined"
            onClick={loadMore}
            disabled={!nextCursor || loadingMore}
            startIcon={loadingMore ? <CircularProgress size={16} /> : null}
          >
            {loadingMore
              ? 'Loading more...'
              : nextCursor
                ? 'Load More'
                : 'Nothing more to load'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          {posts.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  {item.title}
                </Typography>
                <Button
                  component={Link}
                  href={`/post/${item.id}`}
                  variant="text"
                  startIcon={<ViewIcon />}
                >
                  View more
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Paper>

      <Divider />

      {/* Add Post Section */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{ textAlign: 'center' }}
        >
          Add a New Post
        </Typography>

        <Box
          component="form"
          onSubmit={handleAddPost}
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          <Stack spacing={3}>
            <TextField
              id="title"
              name="title"
              label="Title"
              placeholder="Enter post title"
              disabled={addingPost}
              fullWidth
              required
            />
            <TextField
              id="text"
              name="text"
              label="Content"
              placeholder="Enter post content"
              disabled={addingPost}
              multiline
              rows={6}
              fullWidth
              required
            />

            <Box sx={{ textAlign: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={addingPost}
                startIcon={
                  addingPost ? <CircularProgress size={20} /> : <AddIcon />
                }
                sx={{ minWidth: 200 }}
              >
                {addingPost ? 'Adding...' : 'Add Post'}
              </Button>
            </Box>

            {addError && <Alert severity="error">{addError}</Alert>}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
