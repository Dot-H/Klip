import { notFound } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getCragForBatchReport } from '~/lib/data';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { ReportForm } from '~/components/Report/ReportForm';

interface ReportPageProps {
  params: Promise<{ cragId: string }>;
  searchParams: Promise<{ routeId?: string; pitchId?: string }>;
}

export default async function ReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { cragId } = await params;
  const { routeId, pitchId } = await searchParams;
  const crag = await getCragForBatchReport(cragId);

  if (!crag) {
    notFound();
  }

  // Pre-select the pitches behind the entry point: a whole route ("Nouveau
  // rapport") or a single pitch (a specific length). Anything that doesn't
  // belong to this crag is ignored.
  const allRoutes = crag.sectors.flatMap((sector) => sector.routes);
  const initialSelectedPitchIds = new Set<string>();
  let originRouteId: string | undefined;

  if (routeId) {
    const route = allRoutes.find((r) => r.id === routeId);
    if (route) {
      route.pitches.forEach((pitch) => initialSelectedPitchIds.add(pitch.id));
      originRouteId = route.id;
    }
  }
  if (pitchId) {
    const route = allRoutes.find((r) =>
      r.pitches.some((pitch) => pitch.id === pitchId),
    );
    if (route) {
      initialSelectedPitchIds.add(pitchId);
      originRouteId ??= route.id;
    }
  }

  // Return to the originating route (so its report history is visible) when the
  // form was opened from one, otherwise back to the crag.
  const returnTo = originRouteId
    ? `/route/${originRouteId}`
    : `/crag/${crag.id}`;

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: crag.name, href: `/crag/${crag.id}` },
          { label: 'Nouveau rapport' },
        ]}
      />

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
      >
        Nouveau rapport de maintenance
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        Signalez une intervention sur une ou plusieurs longueurs de {crag.name}.
      </Typography>

      {crag.sectors.length === 0 ? (
        <Typography color="text.secondary">
          Aucune voie répertoriée sur ce site.
        </Typography>
      ) : (
        <ReportForm
          cragId={crag.id}
          sectors={crag.sectors}
          initialSelectedPitchIds={[...initialSelectedPitchIds]}
          returnTo={returnTo}
        />
      )}
    </Box>
  );
}
