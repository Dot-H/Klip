'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Divider,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { UserRole } from '~/lib/roles';
import { isValidCotation } from '~/lib/grades';

interface PitchFormData {
  cotation: string;
  length: string;
}

interface RouteAddButtonProps {
  sectorId: string;
  sectorName: string;
  suggestedNumber: number;
}

export function RouteAddButton({
  sectorId,
  sectorName,
  suggestedNumber,
}: RouteAddButtonProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    number: suggestedNumber.toString(),
    name: '',
  });
  const [pitches, setPitches] = useState<PitchFormData[]>([
    { cotation: '', length: '' },
  ]);

  // Fetch user role on mount
  useEffect(() => {
    fetch('/api/user/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) {
          setUserRole(data.role);
        }
      })
      .catch(() => {
        // Ignore errors - user not authenticated
      });
  }, []);

  const canAdd = userRole === 'ADMIN' || userRole === 'ROUTE_SETTER';

  const handleOpen = () => {
    // Reset form data when opening
    setFormData({
      number: suggestedNumber.toString(),
      name: '',
    });
    setPitches([{ cotation: '', length: '' }]);
    setError(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePitchChange = (
    index: number,
    field: keyof PitchFormData,
    value: string,
  ) => {
    setPitches((prev) =>
      prev.map((pitch, i) =>
        i === index ? { ...pitch, [field]: value } : pitch,
      ),
    );
  };

  const handleAddPitch = () => {
    setPitches((prev) => [...prev, { cotation: '', length: '' }]);
  };

  const handleRemovePitch = (index: number) => {
    if (pitches.length > 1) {
      setPitches((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const numberValue = parseInt(formData.number, 10);
      if (isNaN(numberValue) || numberValue <= 0) {
        setError('Le numero doit etre un nombre positif');
        setLoading(false);
        return;
      }

      if (!formData.name.trim()) {
        setError('Le nom est requis');
        setLoading(false);
        return;
      }

      // Validate cotations
      for (const pitch of pitches) {
        if (pitch.cotation && !isValidCotation(pitch.cotation)) {
          setError('Cotation invalide (ex: 6a, 7b+)');
          setLoading(false);
          return;
        }
      }

      const pitchesData = pitches.map((p) => ({
        cotation: p.cotation || null,
        length: p.length ? parseInt(p.length, 10) : null,
      }));

      // Validate pitch lengths are valid numbers
      for (const pitch of pitchesData) {
        if (pitch.length !== null && (isNaN(pitch.length) || pitch.length <= 0)) {
          setError('Les longueurs doivent etre des nombres positifs');
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId,
          number: numberValue,
          name: formData.name || null,
          pitches: pitchesData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create route');
      }

      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip
        title={canAdd ? 'Ajouter une voie' : 'Seuls les ouvreurs peuvent ajouter des voies'}
        arrow
      >
        <span>
          <IconButton
            size="small"
            disabled={!canAdd}
            onClick={handleOpen}
            sx={{
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <AddIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter une voie - {sectorName}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="number"
                label="Numero"
                type="number"
                value={formData.number}
                onChange={handleFormChange}
                required
                sx={{ width: 100 }}
                inputProps={{ min: 1 }}
              />
              <TextField
                name="name"
                label="Nom"
                value={formData.name}
                onChange={handleFormChange}
                required
                fullWidth
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" color="text.secondary">
              Longueurs
            </Typography>

            {pitches.map((pitch, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ minWidth: 30, fontWeight: 'medium' }}
                >
                  L{index + 1}
                </Typography>
                <TextField
                  label="Cotation"
                  value={pitch.cotation}
                  onChange={(e) =>
                    handlePitchChange(index, 'cotation', e.target.value)
                  }
                  size="small"
                  placeholder="6a+"
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Longueur"
                  type="number"
                  value={pitch.length}
                  onChange={(e) =>
                    handlePitchChange(index, 'length', e.target.value)
                  }
                  size="small"
                  sx={{ width: 130 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">m</InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemovePitch(index)}
                  disabled={pitches.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddPitch}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Ajouter une longueur
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
