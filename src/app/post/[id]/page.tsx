import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getPost, type Post } from '~/lib/data';

export function PostItem(props: { post: Post }) {
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

export default async function PostViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch post directly in the server component
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return <PostItem post={post} />;
}
