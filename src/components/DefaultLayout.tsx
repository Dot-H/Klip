import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';

type DefaultLayoutProps = { children: ReactNode };

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};
