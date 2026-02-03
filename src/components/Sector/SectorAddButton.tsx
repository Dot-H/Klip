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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { UserRole } from '~/lib/roles';

interface SectorAddButtonProps {
  cragId: string;
  cragName: string;
}

export function SectorAddButton({ cragId, cragName }: SectorAddButtonProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

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
    setName('');
    setError(null);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) {
        setError('Le nom est requis');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/crag/${cragId}/sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create sector');
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
      {/* Mobile: icon only */}
      <Tooltip
        title={canAdd ? 'Ajouter un secteur' : 'Seuls les ouvreurs peuvent ajouter des secteurs'}
        arrow
      >
        <Box component="span" sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
          <IconButton
            size="small"
            disabled={!canAdd}
            onClick={handleOpen}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Tooltip>

      {/* Desktop: button with text */}
      <Tooltip
        title={canAdd ? '' : 'Seuls les ouvreurs peuvent ajouter des secteurs'}
        arrow
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
          <Button
            size="small"
            disabled={!canAdd}
            onClick={handleOpen}
            startIcon={<AddIcon />}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Ajouter un secteur
          </Button>
        </Box>
      </Tooltip>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un secteur - {cragName}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            <TextField
              label="Nom du secteur"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
            />
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
