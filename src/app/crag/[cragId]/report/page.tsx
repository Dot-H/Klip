import { notFound } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { getCragForBatchReport } from '~/lib/data';
import { Breadcrumbs } from '~/components/Navigation/Breadcrumbs';
import { BatchReportForm } from '~/components/Report/BatchReportForm';

interface BatchReportPageProps {
  params: Promise<{ cragId: string }>;
}

export default async function BatchReportPage({
  params,
}: BatchReportPageProps) {
  const { cragId } = await params;
  const crag = await getCragForBatchReport(cragId);

  if (!crag) {
    notFound();
  }

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: crag.name, href: `/crag/${crag.id}` },
          { label: 'Rapport groupé' },
        ]}
      />

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
      >
        Rapport groupé
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        Signalez la même intervention sur plusieurs voies de {crag.name} en une
        seule fois.
      </Typography>

      {crag.sectors.length === 0 ? (
        <Typography color="text.secondary">
          Aucune voie répertoriée sur ce site.
        </Typography>
      ) : (
        <BatchReportForm cragId={crag.id} sectors={crag.sectors} />
      )}
    </Box>
  );
}
