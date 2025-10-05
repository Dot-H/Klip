'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export function AddPostForm() {
  const [addingPost, setAddingPost] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const router = useRouter();

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

      // Refresh the page to show the new post
      router.refresh();
      form.reset();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAddingPost(false);
    }
  };

  return (
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
  );
}
