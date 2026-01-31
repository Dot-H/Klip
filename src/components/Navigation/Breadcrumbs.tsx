'use client';

import Link from 'next/link';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{
        mb: { xs: 2, sm: 3 },
        '& .MuiBreadcrumbs-ol': {
          flexWrap: 'wrap',
        },
        '& .MuiBreadcrumbs-li': {
          fontSize: { xs: '0.875rem', sm: '1rem' },
        },
      }}
    >
      <MuiLink
        component={Link}
        href="/"
        color="inherit"
        sx={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
        Accueil
      </MuiLink>
      {items.map((item, index) =>
        item.href ? (
          <MuiLink
            key={index}
            component={Link}
            href={item.href}
            color="inherit"
            sx={{
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {item.label}
          </MuiLink>
        ) : (
          <Typography key={index} color="text.primary">
            {item.label}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
