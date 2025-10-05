import Head from 'next/head';
import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Klip - Climbing Route Tracker</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <Box
        sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
          {children}
        </Container>
      </Box>
    </>
  );
};
