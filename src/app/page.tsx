import { Box, Typography, Grid } from '@mui/material';
import { getAllCrags } from '~/lib/data';
import { CragCard } from '~/components/Crag/CragCard';

export default async function HomePage() {
  const crags = await getAllCrags();

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: { xs: 2, sm: 4 }, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
      >
        Sites d'escalade
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {crags.map((crag) => (
          <Grid key={crag.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <CragCard crag={crag} />
          </Grid>
        ))}
      </Grid>

      {crags.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Aucun site d'escalade trouvé.
        </Typography>
      )}
    </Box>
  );
}
