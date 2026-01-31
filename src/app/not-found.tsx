'use client';

import Link from 'next/link';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        gap: 3,
      }}
    >
      <Paper elevation={3} sx={{ p: 6 }}>
        <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page not found
        </Typography>
        <Button
          component={Link}
          href="/"
          variant="contained"
          startIcon={<HomeIcon />}
          size="large"
        >
          Go Home
        </Button>
      </Paper>
    </Box>
  );
}
