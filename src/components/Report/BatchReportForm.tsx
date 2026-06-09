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
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { authClient } from '~/lib/auth/client';
import { AuthRequiredModal } from '~/components/Auth/AuthRequiredModal';
import { pitchIdsOf, groupSelection, filterSectors } from '~/lib/batchReport';
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
  const [query, setQuery] = useState('');
  const [selectedPitchIds, setSelectedPitchIds] = useState<Set<string>>(
    new Set(),
  );
  const [formData, setFormData] = useState<ReportFormData>(
    DEFAULT_REPORT_FORM_DATA,
  );

  // Flat, document-ordered metadata for every pitch — drives the selected
  // chips and the order of the created reports.
  const pitchInfos = useMemo(() => {
    const infos: { id: string; label: string }[] = [];
    for (const sector of sectors) {
      for (const route of sector.routes) {
        const multi = route.pitches.length > 1;
        route.pitches.forEach((pitch, index) => {
          infos.push({
            id: pitch.id,
            label: multi
              ? `${routeLabel(route)} · L${index + 1}`
              : routeLabel(route),
          });
        });
      }
    }
    return infos;
  }, [sectors]);

  const filteredSectors = useMemo(
    () => filterSectors(sectors, query),
    [sectors, query],
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

  const selectedInfos = useMemo(
    () => pitchInfos.filter((info) => selectedPitchIds.has(info.id)),
    [pitchInfos, selectedPitchIds],
  );
  const pitchIds = selectedInfos.map((info) => info.id);

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

  const renderPitchRow = (
    pitch: BatchReportPitch,
    label: string,
    indent: number,
  ) => (
    <ListItem key={pitch.id} disablePadding>
      <ListItemButton onClick={() => togglePitch(pitch.id)} sx={{ pl: indent }}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Checkbox
            edge="start"
            checked={selectedPitchIds.has(pitch.id)}
            tabIndex={-1}
            disableRipple
          />
        </ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  );

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

          {selectedCount > 0 && (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {selectedCount} longueur{plural} sélectionnée{plural}
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                useFlexGap
                spacing={1}
                sx={{ mb: 2 }}
              >
                {selectedInfos.map((info) => (
                  <Chip
                    key={info.id}
                    label={info.label}
                    onDelete={() => togglePitch(info.id)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </>
          )}

          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une voie ou un secteur"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="effacer la recherche"
                    size="small"
                    onClick={() => setQuery('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Box sx={{ mb: 4 }}>
            {!query ? (
              <Typography variant="body2" color="text.secondary">
                Recherchez une voie ou un secteur pour l’ajouter au rapport.
              </Typography>
            ) : filteredSectors.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Aucun résultat pour « {query} ».
              </Typography>
            ) : (
              <Paper variant="outlined">
                {filteredSectors.map((sector, sectorIndex) => {
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
                          if (route.pitches.length === 1) {
                            return renderPitchRow(
                              route.pitches[0],
                              routeLabel(route),
                              4,
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
                                return renderPitchRow(
                                  pitch,
                                  `L${pitchIndex + 1}${details ? ` (${details})` : ''}`,
                                  7,
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
            )}
          </Box>

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
