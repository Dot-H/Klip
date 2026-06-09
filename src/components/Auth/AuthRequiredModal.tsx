'use client';

import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Where to send the user once authenticated. Forwarded to the auth view as
   * both `redirectTo` (email OTP / same-page flows) and `callbackURL` (OAuth /
   * magic-link flows that navigate away from the app and back).
   */
  redirectTo?: string;
}

export function AuthRequiredModal({
  open,
  onClose,
  redirectTo,
}: AuthRequiredModalProps) {
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
          <AuthView redirectTo={redirectTo} callbackURL={redirectTo} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
