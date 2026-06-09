import { notFound } from 'next/navigation';
import { Box, Typography, Chip, Stack } from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { getCragWithRoutes } from '~/lib/data';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { RouteList } from '~/components/Route/RouteList';
import { SectorAddButton } from '~/components/Sector/SectorAddButton';
import { LinkButton } from '~/components/common/LinkButton';

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
        direction="row"
        alignItems="center"
        spacing={{ xs: 1, sm: 2 }}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 2 }}
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
            label={crag.convention ? 'Conventionné' : 'Sans convention'}
            size="small"
            color={crag.convention ? 'success' : 'default'}
          />
        )}
      </Stack>

      {totalRoutes > 0 && (
        <LinkButton
          href={`/crag/${cragId}/report`}
          variant="contained"
          startIcon={<PlaylistAddCheckIcon />}
          sx={{ mb: 3, whiteSpace: 'nowrap' }}
        >
          Rapport groupé
        </LinkButton>
      )}

      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        <Typography variant="body1" color="text.secondary">
          {crag.sectors.length} secteur{crag.sectors.length > 1 ? 's' : ''} •{' '}
          {totalRoutes} voie{totalRoutes > 1 ? 's' : ''}
        </Typography>
        <SectorAddButton cragId={cragId} cragName={crag.name} />
      </Stack>

      {crag.sectors.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Aucun secteur répertorié sur ce site
          </Typography>
          <SectorAddButton cragId={cragId} cragName={crag.name} variant="standalone" />
        </Box>
      ) : (
        crag.sectors.map((sector) => (
          <RouteList key={sector.id} sector={sector} />
        ))
      )}
    </Box>
  );
}
