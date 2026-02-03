import { notFound } from 'next/navigation';
import { Box, Typography, Stack, Paper, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getRouteWithReports } from '~/lib/data';
import { getMaxCotation } from '~/lib/grades';
import { auth } from '~/lib/auth/server';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { ReportCard } from '~/components/Report/ReportCard';
import { LinkButton } from '~/components/common/LinkButton';
import { PitchEditButton } from '~/components/Pitch/PitchEditButton';

interface RoutePageProps {
  params: Promise<{ routeId: string }>;
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { routeId } = await params;
  const [route, session] = await Promise.all([
    getRouteWithReports(routeId),
    auth.getSession(),
  ]);

  if (!route) {
    notFound();
  }

  const currentUserEmail = session.data?.user?.email;

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

  const allReports = route.pitches.flatMap((p, index) =>
    p.reports.map((r) => ({ ...r, pitchId: p.id, pitchNumber: index + 1 })),
  );
  allReports.sort((a, b) => {
    // Compare by day (ignore time)
    const dayA = new Date(a.createdAt).toDateString();
    const dayB = new Date(b.createdAt).toDateString();

    // If same day and same user, sort by pitch number
    if (dayA === dayB && a.reporter.id === b.reporter.id) {
      return a.pitchNumber - b.pitchNumber;
    }

    // Otherwise sort by exact timestamp (most recent first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            {route.pitches.length === 1 && (
              <PitchEditButton pitch={route.pitches[0]} pitchNumber={1} />
            )}
          </Box>
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
                <Box key={pitch.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LinkButton
                    href={`/route/${route.id}/report?pitchId=${pitch.id}`}
                    variant="outlined"
                    size="small"
                    color={hasMissing ? 'warning' : 'primary'}
                  >
                    L{index + 1} ({cotation}, {length})
                  </LinkButton>
                  <PitchEditButton pitch={pitch} pitchNumber={index + 1} />
                </Box>
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
            <ReportCard
              key={report.id}
              report={report}
              pitchNumber={route.pitches.length > 1 ? report.pitchNumber : undefined}
              currentUserEmail={currentUserEmail}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
