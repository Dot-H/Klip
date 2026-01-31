'use client';

import { useState } from 'react';
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { authClient } from '~/lib/auth/client';
import { AuthRequiredModal } from './AuthRequiredModal';

export function UserMenu() {
  const session = authClient.useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    handleClose();
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    handleClose();
    try {
      await authClient.signOut();
    } finally {
      setLoggingOut(false);
    }
  };

  const user = session.data?.user;

  // Get initials from user name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  if (session.isPending) {
    return (
      <IconButton color="inherit" disabled>
        <CircularProgress size={24} color="inherit" />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          p: 0.5,
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {user ? (
          <Avatar
            src={user.image || undefined}
            alt={user.name || user.email || 'User'}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.dark',
              fontSize: '0.875rem',
            }}
          >
            {getInitials()}
          </Avatar>
        ) : (
          <AccountCircleIcon sx={{ fontSize: 32 }} />
        )}
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              mt: 1,
              minWidth: 200,
              '& .MuiMenuItem-root': {
                py: 1.5,
              },
            },
          },
        }}
      >
        {user ? (
          [
            <MenuItem key="profile" disabled>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={user.name || 'Utilisateur'}
                secondary={user.email}
                secondaryTypographyProps={{
                  sx: { fontSize: '0.75rem', color: 'text.secondary' },
                }}
              />
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem key="logout" onClick={handleLogout} disabled={loggingOut}>
              <ListItemIcon>
                {loggingOut ? (
                  <CircularProgress size={20} />
                ) : (
                  <LogoutIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary="Se déconnecter" />
            </MenuItem>,
          ]
        ) : (
          <MenuItem onClick={handleLogin}>
            <ListItemIcon>
              <LoginIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Se connecter" />
          </MenuItem>
        )}
      </Menu>

      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
