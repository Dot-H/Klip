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
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { UserRole } from '~/lib/roles';

interface PitchEditButtonProps {
  pitch: {
    id: string;
    length: number | null;
    cotation: string | null;
  };
  pitchNumber: number;
}

export function PitchEditButton({ pitch, pitchNumber }: PitchEditButtonProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    length: pitch.length?.toString() ?? '',
    cotation: pitch.cotation ?? '',
  });

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

  const canEdit = userRole === 'ADMIN' || userRole === 'ROUTE_SETTER';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const lengthValue = formData.length === '' ? null : parseInt(formData.length, 10);
      const cotationValue = formData.cotation === '' ? null : formData.cotation;

      const response = await fetch(`/api/pitches/${pitch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          length: lengthValue,
          cotation: cotationValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pitch');
      }

      setEditOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating pitch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    // Reset form data to current pitch values when opening
    setFormData({
      length: pitch.length?.toString() ?? '',
      cotation: pitch.cotation ?? '',
    });
    setEditOpen(true);
  };

  return (
    <>
      <Tooltip
        title={canEdit ? '' : 'Seuls les ouvreurs peuvent modifier les longueurs'}
        arrow
      >
        <span>
          <IconButton
            size="small"
            disabled={!canEdit}
            onClick={handleOpen}
            sx={{ p: 0.5 }}
          >
            <EditIcon fontSize="small" data-testid="EditIcon" />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Modifier L{pitchNumber}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              name="length"
              label="Longueur"
              type="number"
              value={formData.length}
              onChange={handleChange}
              fullWidth
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
              inputProps={{ min: 1 }}
            />
            <TextField
              name="cotation"
              label="Cotation"
              value={formData.cotation}
              onChange={handleChange}
              fullWidth
              placeholder="6a+"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
