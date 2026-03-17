import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Box,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { SIDEBAR_WIDTH } from './Sidebar';
import YearSemesterSelector from '../common/YearSemesterSelector';

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  const handleLogout = () => {
    setAnchorEl(null);
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        color: '#131313',
        borderBottom: '1px solid #DFDFDF',
        ...(isDesktop && {
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          ml: `${SIDEBAR_WIDTH}px`,
        }),
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isDesktop && (
            <IconButton onClick={onMenuToggle} edge="start">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ color: '#525252', fontWeight: 400 }}>
            Bienvenue, <strong>{user?.first_name || 'Utilisateur'}</strong>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <YearSemesterSelector />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#001EA6', fontSize: '0.875rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: '#EF4444' }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#EF4444' }} /></ListItemIcon>
              Deconnexion
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
          <LogoutIcon sx={{ color: '#EF4444' }} />
          Se deconnecter
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#525252' }}>
            Etes-vous sur de vouloir vous deconnecter de votre compte ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', color: '#525252', borderColor: '#DFDFDF' }}
          >
            Annuler
          </Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}
          >
            Se deconnecter
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
