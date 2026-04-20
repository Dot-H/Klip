'use client';

import { useParams } from 'next/navigation';
import { Box, Paper } from '@mui/material';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

export default function AuthPage() {
  const params = useParams();
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 450 }}>
        <AuthView path={path} />
      </Paper>
    </Box>
  );
}
