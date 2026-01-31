import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { KlipAppBar } from './Navigation/KlipAppBar';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <KlipAppBar />
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
};
