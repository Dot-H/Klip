'use client';

import Link from 'next/link';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import TerrainIcon from '@mui/icons-material/Terrain';
import { SearchBar } from './SearchBar';
import { UserMenu } from '~/components/Auth/UserMenu';

export function KlipAppBar() {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 0 },
          py: { xs: 1, sm: 0 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Box
            component={Link}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <TerrainIcon sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              KLIP
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />

        <SearchBar />

        <Box sx={{ ml: 2 }}>
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
