import Link from 'next/link';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import TerrainIcon from '@mui/icons-material/Terrain';
import RouteIcon from '@mui/icons-material/Timeline';
import type { CragWithStats } from '~/lib/data';

interface CragCardProps {
  crag: CragWithStats;
}

export function CragCard({ crag }: CragCardProps) {
  return (
    <Card elevation={2}>
      <CardActionArea component={Link} href={`/crag/${crag.id}`}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            {crag.name}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            <Chip
              icon={<TerrainIcon />}
              label={`${crag.sectorCount} secteur${crag.sectorCount > 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<RouteIcon />}
              label={`${crag.routeCount} voie${crag.routeCount > 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          </Stack>

          {crag.convention !== null && (
            <Chip
              label={crag.convention ? 'Convention signée' : 'Sans convention'}
              size="small"
              color={crag.convention ? 'success' : 'default'}
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
