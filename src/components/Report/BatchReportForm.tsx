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
import { pitchIdsOf, groupSelection } from '~/lib/batchReport';
import type { BatchReportSector, BatchReportPitch } from '~/lib/data';
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

const pitchDetails = (pitch: BatchReportPitch) =>
  [pitch.cotation, pitch.length != null ? `${pitch.length}m` : null]
    .filter(Boolean)
    .join(', ');

export function BatchReportForm({ cragId, sectors }: BatchReportFormProps) {
  const router = useRouter();
  const session = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedPitchIds, setSelectedPitchIds] = useState<Set<string>>(
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

  const togglePitch = (pitchId: string) => {
    setSelectedPitchIds((prev) => {
      const next = new Set(prev);
      if (next.has(pitchId)) {
        next.delete(pitchId);
      } else {
        next.add(pitchId);
      }
      return next;
    });
  };

  const toggleMany = (pitchIds: string[], select: boolean) => {
    setSelectedPitchIds((prev) => {
      const next = new Set(prev);
      for (const id of pitchIds) {
        if (select) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  };

  // Selected pitch IDs in display order, so the created reports follow the
  // same ordering the user saw.
  const pitchIds = useMemo(
    () => pitchIdsOf(allRoutes).filter((id) => selectedPitchIds.has(id)),
    [allRoutes, selectedPitchIds],
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
  const selectedCount = pitchIds.length;
  const canSubmit = isAuthenticated && selectedCount > 0;
  const plural = selectedCount > 1 ? 's' : '';

  const submitDisabledReason = !isAuthenticated
    ? 'Vous devez être connecté pour envoyer un rapport'
    : selectedCount === 0
      ? 'Sélectionnez au moins une longueur'
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
            Longueurs concernées
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedCount > 0
              ? `${selectedCount} longueur${plural} sélectionnée${plural}`
              : 'Sélectionnez les longueurs sur lesquelles vous êtes intervenu.'}
          </Typography>

          <Paper variant="outlined" sx={{ mb: 4 }}>
            {sectors.map((sector, sectorIndex) => {
              const sectorPitchIds = pitchIdsOf(sector.routes);
              const sectorState = groupSelection(
                sectorPitchIds,
                selectedPitchIds,
              );
              return (
                <Box key={sector.id}>
                  {sectorIndex > 0 && <Divider />}
                  <ListItemButton
                    onClick={() =>
                      toggleMany(sectorPitchIds, sectorState !== 'all')
                    }
                    sx={{ bgcolor: 'grey.50' }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox
                        edge="start"
                        checked={sectorState === 'all'}
                        indeterminate={sectorState === 'some'}
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
                      // Single-pitch routes are a single selectable line
                      // labelled with the route; multi-pitch routes expand
                      // into one line per pitch.
                      if (route.pitches.length === 1) {
                        const pitch = route.pitches[0];
                        return (
                          <ListItem key={route.id} disablePadding>
                            <ListItemButton
                              onClick={() => togglePitch(pitch.id)}
                              sx={{ pl: 4 }}
                            >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Checkbox
                                  edge="start"
                                  checked={selectedPitchIds.has(pitch.id)}
                                  tabIndex={-1}
                                  disableRipple
                                />
                              </ListItemIcon>
                              <ListItemText primary={routeLabel(route)} />
                            </ListItemButton>
                          </ListItem>
                        );
                      }

                      return (
                        <Box key={route.id}>
                          <ListItem sx={{ pl: 4, py: 0.5 }}>
                            <ListItemText
                              primary={routeLabel(route)}
                              primaryTypographyProps={{
                                variant: 'body2',
                                color: 'text.secondary',
                              }}
                            />
                          </ListItem>
                          {route.pitches.map((pitch, pitchIndex) => {
                            const details = pitchDetails(pitch);
                            return (
                              <ListItem key={pitch.id} disablePadding>
                                <ListItemButton
                                  onClick={() => togglePitch(pitch.id)}
                                  sx={{ pl: 7 }}
                                >
                                  <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Checkbox
                                      edge="start"
                                      checked={selectedPitchIds.has(pitch.id)}
                                      tabIndex={-1}
                                      disableRipple
                                    />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`L${pitchIndex + 1}${details ? ` (${details})` : ''}`}
                                  />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </Box>
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
                    ? `Envoyer le rapport pour ${selectedCount} longueur${plural}`
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
