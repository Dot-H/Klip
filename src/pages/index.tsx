import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';
import type { inferProcedureInput } from '@trpc/server';
import Link from 'next/link';
import { Fragment } from 'react';
import type { AppRouter } from '~/server/routers/_app';
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

const IndexPage: NextPageWithLayout = () => {
  const utils = trpc.useUtils();
  const postsQuery = trpc.post.list.useInfiniteQuery(
    {
      limit: 5,
    },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    },
  );

  const addPost = trpc.post.add.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.post.list.invalidate();
    },
  });

  // prefetch all posts for instant navigation
  // useEffect(() => {
  //   const allPosts = postsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  //   for (const { id } of allPosts) {
  //     void utils.post.byId.prefetch({ id });
  //   }
  // }, [postsQuery.data, utils]);

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
          If you get stuck, check{' '}
          <Link
            href="https://trpc.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            the tRPC docs
          </Link>
          , write a message in our{' '}
          <Link
            href="https://trpc.io/discord"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord channel
          </Link>
          , or write a message in{' '}
          <Link
            href="https://github.com/trpc/trpc/discussions"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Discussions
          </Link>
          .
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
            {postsQuery.status === 'pending' && (
              <CircularProgress size={20} sx={{ ml: 2 }} />
            )}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => postsQuery.fetchNextPage()}
            disabled={!postsQuery.hasNextPage || postsQuery.isFetchingNextPage}
            startIcon={
              postsQuery.isFetchingNextPage ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {postsQuery.isFetchingNextPage
              ? 'Loading more...'
              : postsQuery.hasNextPage
                ? 'Load More'
                : 'Nothing more to load'}
          </Button>
        </Box>

        <Stack spacing={2}>
          {postsQuery.data?.pages.map((page, index) => (
            <Fragment key={page.items[0]?.id || index}>
              {page.items.map((item) => (
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
            </Fragment>
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
          onSubmit={async (e) => {
            e.preventDefault();
            const $form = e.currentTarget;
            const values = Object.fromEntries(new FormData($form));
            type Input = inferProcedureInput<AppRouter['post']['add']>;
            const input: Input = {
              title: values.title as string,
              text: values.text as string,
            };
            try {
              await addPost.mutateAsync(input);
              $form.reset();
            } catch (cause) {
              console.error({ cause }, 'Failed to add post');
            }
          }}
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          <Stack spacing={3}>
            <TextField
              id="title"
              name="title"
              label="Title"
              placeholder="Enter post title"
              disabled={addPost.isPending}
              fullWidth
              required
            />
            <TextField
              id="text"
              name="text"
              label="Content"
              placeholder="Enter post content"
              disabled={addPost.isPending}
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
                disabled={addPost.isPending}
                startIcon={
                  addPost.isPending ? (
                    <CircularProgress size={20} />
                  ) : (
                    <AddIcon />
                  )
                }
                sx={{ minWidth: 200 }}
              >
                {addPost.isPending ? 'Adding...' : 'Add Post'}
              </Button>
            </Box>

            {addPost.error && (
              <Alert severity="error">{addPost.error.message}</Alert>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @see https://trpc.io/docs/v11/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createServerSideHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.post.all.fetch();
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
