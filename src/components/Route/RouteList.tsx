'use client';

import Link from 'next/link';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { SectorWithRoutes } from '~/lib/data';
import { getMaxCotation } from '~/lib/grades';
import { RouteAddButton } from './RouteAddButton';

interface RouteListProps {
  sector: SectorWithRoutes;
}

export function RouteList({ sector }: RouteListProps) {
  const suggestedNumber =
    Math.max(...sector.routes.map((r) => r.number), 0) + 1;

  return (
    <Paper elevation={1} sx={{ mb: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          {sector.name}
        </Typography>
        <RouteAddButton
          sectorId={sector.id}
          sectorName={sector.name}
          suggestedNumber={suggestedNumber}
        />
      </Box>
      {sector.routes.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Aucune voie repertoriee dans ce secteur
          </Typography>
          <RouteAddButton
            sectorId={sector.id}
            sectorName={sector.name}
            suggestedNumber={suggestedNumber}
            variant="standalone"
          />
        </Box>
      ) : (
        <List disablePadding>
          {sector.routes.map((route, index) => {
            const allPitchesHaveLength = route.pitches.every((p) => p.length != null);
            const computedLength = allPitchesHaveLength
              ? route.pitches.reduce((sum, p) => sum + (p.length ?? 0), 0)
              : null;
            const totalLength = route.length ?? computedLength;
            const maxCotation = getMaxCotation(route.pitches);
            const allPitchesHaveCotation = route.pitches.every((p) => p.cotation != null);

            return (
              <ListItem
                key={route.id}
                disablePadding
                divider={index < sector.routes.length - 1}
              >
                <ListItemButton component={Link} href={`/route/${route.id}`}>
                  <ListItemText
                    primary={
                      <>
                        {route.name
                          ? `${route.number}. ${route.name}`
                          : `Voie ${route.number}`}
                        <Typography
                          component="span"
                          variant="body2"
                          color={allPitchesHaveCotation ? 'text.secondary' : 'warning.main'}
                          sx={{ ml: 1 }}
                        >
                          {maxCotation ?? 'Cotation?'}
                        </Typography>
                        <Typography
                          component="span"
                          variant="body2"
                          color={totalLength != null ? 'text.secondary' : 'warning.main'}
                          sx={{ ml: 1 }}
                        >
                          {totalLength != null ? `${totalLength}m` : '?m'}
                        </Typography>
                      </>
                    }
                  />
                  <ChevronRightIcon color="action" />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
