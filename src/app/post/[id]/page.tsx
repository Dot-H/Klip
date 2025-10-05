'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Skeleton,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface Post {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

function PostItem(props: { post: Post }) {
  const { post } = props;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        sx={{ alignSelf: 'flex-start' }}
      >
        Home
      </Button>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {post.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Created {new Date(post.createdAt).toLocaleDateString('en-us')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" paragraph>
          {post.text}
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Raw data:
        </Typography>
        <Box
          component="pre"
          sx={{
            backgroundColor: 'grey.900',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
          }}
        >
          {JSON.stringify(post, null, 4)}
        </Box>
      </Paper>
    </Box>
  );
}

export default function PostViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (res.status === 404) {
          notFound();
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch post: ${res.statusText}`);
        }
        const data: Post = await res.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={40} width={120} />
        <Skeleton variant="text" height={60} />
        <Skeleton variant="text" height={20} />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!post) {
    return null; // Should ideally not happen if notFound is called for 404
  }

  return <PostItem post={post} />;
}
