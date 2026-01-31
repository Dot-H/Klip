'use client';

import Link from 'next/link';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { SectorWithRoutes } from '~/lib/data';

interface RouteListProps {
  sector: SectorWithRoutes;
}

export function RouteList({ sector }: RouteListProps) {
  return (
    <Paper elevation={1} sx={{ mb: { xs: 2, sm: 3 } }}>
      <Typography
        variant="h6"
        component="h3"
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          fontSize: { xs: '1rem', sm: '1.25rem' },
        }}
      >
        {sector.name}
      </Typography>
      <List disablePadding>
        {sector.routes.map((route, index) => (
          <ListItem
            key={route.id}
            disablePadding
            divider={index < sector.routes.length - 1}
          >
            <ListItemButton component={Link} href={`/route/${route.id}`}>
              <ListItemText
                primary={
                  route.name
                    ? `${route.number}. ${route.name}`
                    : `Voie ${route.number}`
                }
              />
              <ChevronRightIcon color="action" />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
