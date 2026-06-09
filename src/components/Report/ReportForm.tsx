'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { authClient } from '~/lib/auth/client';
import { AuthRequiredModal } from '~/components/Auth/AuthRequiredModal';
import {
  loadReportDraft,
  saveReportDraft,
  clearReportDraft,
} from '~/lib/reportDraft';
import { ReporterIdentity } from './ReporterIdentity';
import { ReportFields } from './ReportFields';
import {
  type ReportFormData,
  DEFAULT_REPORT_FORM_DATA,
  applyReportFieldChange,
} from './reportFormData';

interface Pitch {
  id: string;
  cotation: string | null;
  length: number | null;
}

interface ReportFormProps {
  pitchId: string;
  routeId: string;
  pitches: Pitch[];
}

export function ReportForm({ pitchId, routeId, pitches }: ReportFormProps) {
  const router = useRouter();
  const session = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);
  const [selectedPitchIds, setSelectedPitchIds] = useState<string[]>([pitchId]);
  const [formData, setFormData] = useState<ReportFormData>(
    DEFAULT_REPORT_FORM_DATA,
  );
  // Becomes true once we've attempted to restore a saved draft. We must not
  // persist before this, otherwise the initial empty state would overwrite a
  // draft saved before the user left to sign in.
  const [hydrated, setHydrated] = useState(false);

  // Restore a previously saved draft (e.g. after returning from sign-in). Runs
  // once: the `hydrated` guard short-circuits any re-run from changing deps.
  useEffect(() => {
    if (hydrated) {
      return;
    }
    const draft = loadReportDraft();
    if (draft && draft.routeId === routeId) {
      // Only keep pitches that still belong to this route.
      const validPitchIds = draft.selectedPitchIds.filter((id) =>
        pitches.some((pitch) => pitch.id === id),
      );
      if (validPitchIds.length > 0) {
        setSelectedPitchIds(validPitchIds);
      }
      const { routeId: _routeId, selectedPitchIds: _pitchIds, ...rest } = draft;
      setFormData({ ...DEFAULT_REPORT_FORM_DATA, ...rest });
    }
    setHydrated(true);
  }, [hydrated, routeId, pitches]);

  // Persist the draft on every change so it survives a full page navigation.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveReportDraft({ routeId, selectedPitchIds, ...formData });
  }, [hydrated, routeId, selectedPitchIds, formData]);

  const openAuthModal = () => {
    // Send the user back to this exact report form once authenticated, so the
    // restored draft is shown again instead of a blank page.
    if (typeof window !== 'undefined') {
      setRedirectTo(window.location.pathname + window.location.search);
    }
    setAuthModalOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => applyReportFieldChange(prev, e));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session.data?.user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, pitchIds: selectedPitchIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // The report was saved server-side; drop the local draft.
      clearReportDraft();
      router.push(`/route/${routeId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!session.data?.user;

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

          <ReporterIdentity onSignInClick={openAuthModal} />

          {pitches.length > 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Longueurs concernées
              </Typography>
              <ToggleButtonGroup
                value={selectedPitchIds}
                onChange={(_, value: string[]) =>
                  value.length > 0 && setSelectedPitchIds(value)
                }
                sx={{ mb: 4, flexWrap: 'wrap' }}
              >
                {pitches.map((pitch, index) => {
                  const details = [
                    pitch.cotation,
                    pitch.length != null ? `${pitch.length}m` : null,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <ToggleButton
                      key={pitch.id}
                      value={pitch.id}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'primary.100',
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.200',
                          },
                        },
                      }}
                    >
                      L{index + 1}
                      {details && ` (${details})`}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </>
          )}

          <ReportFields formData={formData} onChange={handleChange} />

          <Tooltip
            title={
              isAuthenticated
                ? ''
                : 'Vous devez être connecté pour envoyer un rapport'
            }
            arrow
          >
            <span>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !isAuthenticated}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SendIcon />
                }
                fullWidth
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le rapport'}
              </Button>
            </span>
          </Tooltip>
        </form>
      </Paper>

      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={redirectTo}
      />
    </>
  );
}
