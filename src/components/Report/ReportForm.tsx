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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ReportFormProps {
  pitchId: string;
  routeId: string;
}

export function ReportForm({ pitchId, routeId }: ReportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
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
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, pitchId }),
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

  return (
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
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            name="firstname"
            label="Prénom"
            value={formData.firstname}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="lastname"
            label="Nom"
            value={formData.lastname}
            onChange={handleChange}
            required
            fullWidth
          />
        </Box>

        <TextField
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          fullWidth
          sx={{ mb: 4 }}
        />

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

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          fullWidth
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le rapport'}
        </Button>
      </form>
    </Paper>
  );
}
