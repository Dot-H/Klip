import { Card, CardContent, Typography, Stack, Chip, Box } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AnchorIcon from '@mui/icons-material/Anchor';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import BuildIcon from '@mui/icons-material/Build';
import type { PitchWithReports } from '~/lib/data';

type Report = PitchWithReports['reports'][number];

interface ReportCardProps {
  report: Report;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function ReportCard({ report }: ReportCardProps) {
  const checks = [
    { done: report.visualCheck, label: 'Contrôle visuel', icon: VisibilityIcon },
    { done: report.anchorCheck, label: 'Ancrages vérifiés', icon: AnchorIcon },
    {
      done: report.cleaningDone,
      label: 'Nettoyage',
      icon: CleaningServicesIcon,
    },
    { done: report.trundleDone, label: 'Purge', icon: DeleteSweepIcon },
    {
      done: report.totalReboltingDone,
      label: 'Rééquipement total',
      icon: BuildIcon,
    },
  ];

  const completedChecks = checks.filter((c) => c.done);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'flex-start' },
            gap: { xs: 0.5, sm: 0 },
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {report.reporter.firstname} {report.reporter.lastname}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(report.createdAt)}
          </Typography>
        </Box>

        {completedChecks.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {completedChecks.map((check) => (
              <Chip
                key={check.label}
                icon={<check.icon />}
                label={check.label}
                size="small"
                color="success"
                variant="outlined"
              />
            ))}
          </Stack>
        )}

        {report.comment && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {report.comment}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
