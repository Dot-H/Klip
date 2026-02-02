import { notFound } from 'next/navigation';
import { Box, Typography, Stack, Paper, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getRouteWithReports } from '~/lib/data';
import { getMaxCotation } from '~/lib/grades';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { ReportCard } from '~/components/Report/ReportCard';
import { LinkButton } from '~/components/common/LinkButton';

interface RoutePageProps {
  params: Promise<{ routeId: string }>;
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { routeId } = await params;
  const route = await getRouteWithReports(routeId);

  if (!route) {
    notFound();
  }

  const routeName = route.name
    ? `${route.number}. ${route.name}`
    : `Voie ${route.number}`;

  // Calculate total length: use route.length if set, otherwise sum pitch lengths
  const allPitchesHaveLength = route.pitches.every((p) => p.length != null);
  const computedLength = allPitchesHaveLength
    ? route.pitches.reduce((sum, p) => sum + (p.length ?? 0), 0)
    : null;
  const totalLength = route.length ?? computedLength;

  // Get max cotation from pitches
  const allPitchesHaveCotation = route.pitches.every((p) => p.cotation != null);
  const maxCotation = getMaxCotation(route.pitches);

  const allReports = route.pitches.flatMap((p) =>
    p.reports.map((r) => ({ ...r, pitchId: p.id })),
  );
  allReports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const firstPitchId = route.pitches[0]?.id;

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: route.sector.crag.name, href: `/crag/${route.sector.crag.id}` },
          { label: route.sector.name },
          { label: routeName },
        ]}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            {routeName}
            <Typography
              component="span"
              variant="h6"
              color={allPitchesHaveCotation ? 'text.secondary' : 'warning.main'}
              sx={{ ml: 1.5, fontWeight: 'normal' }}
            >
              {maxCotation ?? 'Cotation?'}
            </Typography>
            <Typography
              component="span"
              variant="h6"
              color={totalLength != null ? 'text.secondary' : 'warning.main'}
              sx={{ ml: 1, fontWeight: 'normal' }}
            >
              {totalLength != null ? `${totalLength}m` : '?m'}
            </Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {route.sector.name} • {route.sector.crag.name}
          </Typography>
        </Box>

        {firstPitchId && (
          <LinkButton
            href={`/route/${route.id}/report?pitchId=${firstPitchId}`}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nouveau rapport
          </LinkButton>
        )}
      </Stack>

      {route.pitches.length > 1 && (
        <Paper elevation={1} sx={{ p: 2, mb: { xs: 2, sm: 4 } }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Longueurs
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {route.pitches.map((pitch, index) => {
              const cotation = pitch.cotation ?? '?';
              const length = pitch.length != null ? `${pitch.length}m` : '?m';
              const hasMissing = !pitch.cotation || pitch.length == null;
              return (
                <LinkButton
                  key={pitch.id}
                  href={`/route/${route.id}/report?pitchId=${pitch.id}`}
                  variant="outlined"
                  size="small"
                  color={hasMissing ? 'warning' : 'primary'}
                >
                  L{index + 1} ({cotation}, {length})
                </LinkButton>
              );
            })}
          </Stack>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" component="h2" gutterBottom>
        Historique des rapports
      </Typography>

      {allReports.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Aucun rapport pour cette voie.
        </Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          {allReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </Box>
      )}
    </Box>
  );
}
