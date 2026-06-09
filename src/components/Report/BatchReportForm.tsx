'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { authClient } from '~/lib/auth/client';
import { AuthRequiredModal } from '~/components/Auth/AuthRequiredModal';
import { collectPitchIds } from '~/lib/batchReport';
import type { BatchReportSector } from '~/lib/data';
import { ReporterIdentity } from './ReporterIdentity';
import { ReportFields } from './ReportFields';
import {
  type ReportFormData,
  DEFAULT_REPORT_FORM_DATA,
  applyReportFieldChange,
} from './reportFormData';

interface BatchReportFormProps {
  cragId: string;
  sectors: BatchReportSector[];
}

const routeLabel = (route: { number: number; name: string | null }) =>
  route.name ? `${route.number}. ${route.name}` : `Voie ${route.number}`;

export function BatchReportForm({ cragId, sectors }: BatchReportFormProps) {
  const router = useRouter();
  const session = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(
    new Set(),
  );
  const [formData, setFormData] = useState<ReportFormData>(
    DEFAULT_REPORT_FORM_DATA,
  );

  const allRoutes = useMemo(
    () => sectors.flatMap((sector) => sector.routes),
    [sectors],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => applyReportFieldChange(prev, e));
  };

  const toggleRoute = (routeId: string) => {
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  };

  const toggleSector = (sector: BatchReportSector, selectAll: boolean) => {
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      for (const route of sector.routes) {
        if (selectAll) {
          next.add(route.id);
        } else {
          next.delete(route.id);
        }
      }
      return next;
    });
  };

  const pitchIds = useMemo(
    () => collectPitchIds(allRoutes, selectedRouteIds),
    [allRoutes, selectedRouteIds],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session.data?.user || pitchIds.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, pitchIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Une erreur est survenue');
      }

      router.push(`/crag/${cragId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!session.data?.user;
  const selectedCount = selectedRouteIds.size;
  const canSubmit = isAuthenticated && pitchIds.length > 0;

  const submitDisabledReason = !isAuthenticated
    ? 'Vous devez être connecté pour envoyer un rapport'
    : pitchIds.length === 0
      ? 'Sélectionnez au moins une voie'
      : '';

  return (
    <>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            Vos informations
          </Typography>

          <ReporterIdentity onSignInClick={() => setAuthModalOpen(true)} />

          <Typography variant="h6" gutterBottom>
            Voies concernées
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedCount > 0
              ? `${selectedCount} voie${selectedCount > 1 ? 's' : ''} sélectionnée${selectedCount > 1 ? 's' : ''}`
              : 'Sélectionnez les voies sur lesquelles vous êtes intervenu.'}
          </Typography>

          <Paper variant="outlined" sx={{ mb: 4 }}>
            {sectors.map((sector, sectorIndex) => {
              const selectedInSector = sector.routes.filter((route) =>
                selectedRouteIds.has(route.id),
              ).length;
              const allSelected = selectedInSector === sector.routes.length;
              const someSelected = selectedInSector > 0 && !allSelected;
              return (
                <Box key={sector.id}>
                  {sectorIndex > 0 && <Divider />}
                  <ListItemButton
                    onClick={() => toggleSector(sector, !allSelected)}
                    sx={{ bgcolor: 'grey.50' }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        edge="start"
                        checked={allSelected}
                        indeterminate={someSelected}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={sector.name}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                  <List disablePadding>
                    {sector.routes.map((route) => {
                      const checked = selectedRouteIds.has(route.id);
                      return (
                        <ListItem key={route.id} disablePadding>
                          <ListItemButton
                            onClick={() => toggleRoute(route.id)}
                            sx={{ pl: 4 }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Checkbox
                                edge="start"
                                checked={checked}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemText primary={routeLabel(route)} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              );
            })}
          </Paper>

          <ReportFields formData={formData} onChange={handleChange} />

          <Tooltip title={submitDisabledReason} arrow>
            <span>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !canSubmit}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SendIcon />
                }
                fullWidth
              >
                {loading
                  ? 'Envoi en cours...'
                  : selectedCount > 0
                    ? `Envoyer le rapport pour ${selectedCount} voie${selectedCount > 1 ? 's' : ''}`
                    : 'Envoyer le rapport'}
              </Button>
            </span>
          </Tooltip>
        </form>
      </Paper>

      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
