'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { authClient } from '~/lib/auth/client';
import { AuthRequiredModal } from '~/components/Auth/AuthRequiredModal';

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
  const [selectedPitchIds, setSelectedPitchIds] = useState<string[]>([pitchId]);

  const [formData, setFormData] = useState({
    visualCheck: false,
    anchorCheck: false,
    cleaningDone: false,
    trundleDone: false,
    totalReboltingDone: false,
    comment: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 4,
              p: 2,
              bgcolor: isAuthenticated ? 'success.50' : 'grey.100',
              borderRadius: 1,
              border: 1,
              borderColor: isAuthenticated ? 'success.200' : 'grey.300',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isAuthenticated ? (
                <CheckCircleIcon color="success" />
              ) : (
                <PersonIcon color="action" />
              )}
              {session.isPending ? (
                <CircularProgress size={20} />
              ) : isAuthenticated ? (
                <Typography>
                  Connecté en tant que{' '}
                  <strong>
                    {session.data.user.name || session.data.user.email}
                  </strong>
                </Typography>
              ) : (
                <Typography color="text.secondary">
                  Vous devez vous connecter pour envoyer le rapport
                </Typography>
              )}
            </Box>

            {!session.isPending && !isAuthenticated && (
              <Button
                variant="contained"
                size="small"
                startIcon={<LoginIcon />}
                onClick={() => setAuthModalOpen(true)}
              >
                Se connecter
              </Button>
            )}
          </Box>

          {pitches.length > 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Longueurs concernées
              </Typography>
              <ToggleButtonGroup
                value={selectedPitchIds}
                onChange={(_, value: string[]) => value.length > 0 && setSelectedPitchIds(value)}
                sx={{ mb: 4, flexWrap: 'wrap' }}
              >
                {pitches.map((pitch, index) => {
                  const details = [pitch.cotation, pitch.length != null ? `${pitch.length}m` : null]
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
                      L{index + 1}{details && ` (${details})`}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </>
          )}

          <Typography variant="h6" gutterBottom>
            Actions réalisées
          </Typography>

          <FormGroup sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="visualCheck"
                  checked={formData.visualCheck}
                  onChange={handleChange}
                />
              }
              label="Contrôle visuel effectué"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="anchorCheck"
                  checked={formData.anchorCheck}
                  onChange={handleChange}
                />
              }
              label="Ancrages vérifiés"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="cleaningDone"
                  checked={formData.cleaningDone}
                  onChange={handleChange}
                />
              }
              label="Nettoyage effectué"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="trundleDone"
                  checked={formData.trundleDone}
                  onChange={handleChange}
                />
              }
              label="Purge effectuée"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="totalReboltingDone"
                  checked={formData.totalReboltingDone}
                  onChange={handleChange}
                />
              }
              label="Rééquipement total effectué"
            />
          </FormGroup>

          <TextField
            name="comment"
            label="Commentaire (optionnel)"
            value={formData.comment}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            sx={{ mb: 3 }}
          />

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
      />
    </>
  );
}
