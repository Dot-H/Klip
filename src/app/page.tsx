import Link from 'next/link';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { getPosts, type PostsResponse } from '~/lib/data';
import { AddPostForm } from '~/components/Posts/AddPostForm';

export default async function HomePage() {
  // Fetch posts directly in the server component
  const postsData: PostsResponse = await getPosts(5);

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
        <Typography variant="h4" component="h2" gutterBottom>
          Latest Posts
        </Typography>

        <Stack spacing={2}>
          {postsData.items.map((item) => (
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
      <AddPostForm />
    </Box>
  );
}
