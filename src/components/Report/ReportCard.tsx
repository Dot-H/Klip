'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AnchorIcon from '@mui/icons-material/Anchor';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { USER_ROLE_LABELS, type UserRole } from '~/lib/roles';
import type { PitchWithReports } from '~/lib/data';

type Report = PitchWithReports['reports'][number];

interface ReportCardProps {
  report: Report;
  pitchNumber?: number;
  currentUserEmail?: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function getRoleChipColor(role: UserRole): 'default' | 'primary' | 'secondary' {
  switch (role) {
    case 'ADMIN':
      return 'secondary';
    case 'ROUTE_SETTER':
      return 'primary';
    default:
      return 'default';
  }
}

export function ReportCard({ report, pitchNumber, currentUserEmail }: ReportCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    visualCheck: report.visualCheck ?? false,
    anchorCheck: report.anchorCheck ?? false,
    cleaningDone: report.cleaningDone ?? false,
    trundleDone: report.trundleDone ?? false,
    totalReboltingDone: report.totalReboltingDone ?? false,
    comment: report.comment ?? '',
  });

  // Check if current user owns this report
  const isOwner = currentUserEmail &&
    report.reporter &&
    'email' in report.reporter &&
    report.reporter.email === currentUserEmail;

  const checks = [
    { done: report.visualCheck, label: 'Contrôle visuel', icon: VisibilityIcon },
    { done: report.anchorCheck, label: 'Ancrages vérifiés', icon: AnchorIcon },
    { done: report.cleaningDone, label: 'Nettoyage', icon: CleaningServicesIcon },
    { done: report.trundleDone, label: 'Purge', icon: DeleteSweepIcon },
    { done: report.totalReboltingDone, label: 'Rééquipement total', icon: BuildIcon },
  ];

  const completedChecks = checks.filter((c) => c.done);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      setEditOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error deleting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'flex-start' },
              gap: { xs: 0.5, sm: 0 },
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {report.reporter.firstname} {report.reporter.lastname}
              </Typography>
              <Chip
                label={USER_ROLE_LABELS[report.reporter.role as UserRole]}
                size="small"
                color={getRoleChipColor(report.reporter.role as UserRole)}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              {pitchNumber && (
                <Chip label={`L${pitchNumber}`} size="small" variant="outlined" />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {formatDate(report.createdAt)}
              </Typography>
              {isOwner && (
                <>
                  <IconButton size="small" onClick={() => setEditOpen(true)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteOpen(true)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>

          {completedChecks.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {completedChecks.map((check) => (
                <Chip
                  key={check.label}
                  icon={<check.icon />}
                  label={check.label}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}

          {report.comment && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {report.comment}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le rapport</DialogTitle>
        <DialogContent>
          <FormGroup sx={{ mt: 1 }}>
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
            label="Commentaire"
            value={formData.comment}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Supprimer le rapport</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
