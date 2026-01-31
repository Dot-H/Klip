import { notFound } from 'next/navigation';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { getCragWithRoutes } from '~/lib/data';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { RouteList } from '~/components/Route/RouteList';

interface CragPageProps {
  params: Promise<{ cragId: string }>;
}

export default async function CragPage({ params }: CragPageProps) {
  const { cragId } = await params;
  const crag = await getCragWithRoutes(cragId);

  if (!crag) {
    notFound();
  }

  const totalRoutes = crag.sectors.reduce((sum, s) => sum + s.routes.length, 0);

  return (
    <Box>
      <Breadcrumbs items={[{ label: crag.name }]} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={{ xs: 1, sm: 2 }}
        sx={{ mb: 3 }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          {crag.name}
        </Typography>
        {crag.convention !== null && (
          <Chip
            label={crag.convention ? 'Convention signée' : 'Sans convention'}
            size="small"
            color={crag.convention ? 'success' : 'default'}
          />
        )}
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, sm: 4 } }}>
        {crag.sectors.length} secteur{crag.sectors.length > 1 ? 's' : ''} •{' '}
        {totalRoutes} voie{totalRoutes > 1 ? 's' : ''}
      </Typography>

      {crag.sectors.map((sector) => (
        <RouteList key={sector.id} sector={sector} />
      ))}
    </Box>
  );
}
