import { notFound, redirect } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getPitch } from '~/lib/data';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { ReportForm } from '~/components/Report/ReportForm';

interface ReportPageProps {
  params: Promise<{ routeId: string }>;
  searchParams: Promise<{ pitchId?: string }>;
}

export default async function ReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const { routeId } = await params;
  const { pitchId } = await searchParams;

  if (!pitchId) {
    redirect(`/route/${routeId}`);
  }

  const pitch = await getPitch(pitchId);

  if (!pitch || pitch.route.id !== routeId) {
    notFound();
  }

  const route = pitch.route;
  const routeName = route.name
    ? `${route.number}. ${route.name}`
    : `Voie ${route.number}`;

  return (
    <Box>
      <Breadcrumbs
        items={[
          {
            label: route.sector.crag.name,
            href: `/crag/${route.sector.crag.id}`,
          },
          { label: route.sector.name },
          { label: routeName, href: `/route/${routeId}` },
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
        {routeName} • {route.sector.name} • {route.sector.crag.name}
      </Typography>

      <ReportForm
        pitchId={pitchId}
        routeId={routeId}
        pitches={route.pitches}
      />
    </Box>
  );
}
