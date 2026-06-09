'use client';

import { Box, Button, Typography, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { authClient } from '~/lib/auth/client';

interface ReporterIdentityProps {
  /** Called when the user taps "Se connecter". */
  onSignInClick: () => void;
}

/**
 * Banner showing who is filing the report, with a sign-in prompt when the
 * visitor is not authenticated. Shared by the single-route and batch forms.
 */
export function ReporterIdentity({ onSignInClick }: ReporterIdentityProps) {
  const session = authClient.useSession();
  const isAuthenticated = !!session.data?.user;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
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
        ) : isAuthenticated && session.data ? (
          <Typography>
            Connecté en tant que{' '}
            <strong>
              {session.data.user?.name || session.data.user?.email}
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
          onClick={onSignInClick}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: 'flex-start', sm: 'auto' },
            whiteSpace: 'nowrap',
          }}
        >
          Se connecter
        </Button>
      )}
    </Box>
  );
}
