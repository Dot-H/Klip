'use client';

import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ open, onClose }: AuthRequiredModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Connexion requise
        <IconButton
          aria-label="fermer"
          onClick={onClose}
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ py: 2 }}>
          <AuthView />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
