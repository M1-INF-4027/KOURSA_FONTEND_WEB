import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRoles } from '../../hooks/useRoles';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as FichesIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  HowToReg as DeleguesIcon,
  FileDownload as ExportIcon,
  School as SchoolIcon,
  AccountBalance as FaculteIcon,
  Business as DeptIcon,
  AccountTree as FiliereIcon,
  Layers as NiveauIcon,
  MenuBook as UEIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import logo from '../../assets/logo.png';

const SIDEBAR_WIDTH = 260;

const menuItems = {
  delegue: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Mes Fiches', path: '/delegue/fiches', icon: <FichesIcon /> },
    { label: 'Profil', path: '/profile', icon: <PersonIcon /> },
  ],
  enseignant: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Mes Fiches', path: '/fiches', icon: <FichesIcon /> },
    { label: 'Profil', path: '/profile', icon: <PersonIcon /> },
  ],
  chef: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Demandes', path: '/chef/delegues', icon: <DeleguesIcon /> },
    { label: 'Utilisateurs', path: '/chef/utilisateurs', icon: <PeopleIcon /> },
    { label: 'Fiches', path: '/chef/fiches', icon: <FichesIcon /> },
    { label: 'Export', path: '/chef/export', icon: <ExportIcon /> },
    { label: 'Profil', path: '/profile', icon: <PersonIcon /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    {
      label: 'Structure Academique',
      icon: <SchoolIcon />,
      children: [
        { label: 'Facultes', path: '/admin/facultes', icon: <FaculteIcon /> },
        { label: 'Departements', path: '/admin/departements', icon: <DeptIcon /> },
        { label: 'Filieres', path: '/admin/filieres', icon: <FiliereIcon /> },
        { label: 'Niveaux', path: '/admin/niveaux', icon: <NiveauIcon /> },
      ],
    },
    { label: 'UEs', path: '/admin/ues', icon: <UEIcon /> },
    { label: 'Utilisateurs', path: '/admin/utilisateurs', icon: <PeopleIcon /> },
    { label: 'Fiches', path: '/admin/fiches', icon: <FichesIcon /> },
    { label: 'Profil', path: '/profile', icon: <PersonIcon /> },
  ],
};

const roleColors = {
  'Super Administrateur': '#EF4444',
  'Chef de Département': '#7C3AED',
  'Enseignant': '#001EA6',
  'Délégué': '#10B981',
};

function SidebarContent({ onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, isChef, isEnseignant, isDelegue, roles } = useRoles();
  const [openSub, setOpenSub] = useState(true);

  const items = isAdmin
    ? menuItems.admin
    : isChef
      ? menuItems.chef
      : isDelegue
        ? menuItems.delegue
        : menuItems.enseignant;
  const mainRole = roles[0] || '';
  const roleColor = roleColors[mainRole] || '#7E7E7E';

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img src={logo} alt="Koursa" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#001EA6', letterSpacing: '-0.02em' }}>
          Koursa
        </Typography>
      </Box>

      {/* User info + role badge */}
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#131313', lineHeight: 1.3 }}>
          {user?.first_name} {user?.last_name}
        </Typography>
        <Box
          sx={{
            display: 'inline-block',
            mt: 0.5,
            px: 1.5,
            py: 0.3,
            borderRadius: 2,
            bgcolor: `${roleColor}14`,
            color: roleColor,
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {mainRole}
        </Box>
      </Box>

      <Divider />

      {/* Menu */}
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {items.map((item) =>
          item.children ? (
            <Box key={item.label}>
              <ListItemButton
                onClick={() => setOpenSub(!openSub)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#7E7E7E' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                {openSub ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openSub}>
                <List disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton
                      key={child.path}
                      selected={location.pathname === child.path}
                      onClick={() => handleNav(child.path)}
                      sx={{
                        pl: 4,
                        borderRadius: 2,
                        mb: 0.3,
                        '&.Mui-selected': {
                          bgcolor: 'rgba(0, 30, 166, 0.08)',
                          color: '#001EA6',
                          '& .MuiListItemIcon-root': { color: '#001EA6' },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: '#7E7E7E' }}>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.825rem' }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          ) : (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 30, 166, 0.08)',
                  color: '#001EA6',
                  '& .MuiListItemIcon-root': { color: '#001EA6' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#7E7E7E' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
            </ListItemButton>
          )
        )}
      </List>

      {/* Logout */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: '#EF4444' }}>
          <ListItemIcon sx={{ minWidth: 40, color: '#EF4444' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Deconnexion" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <>
      {/* Mobile drawer */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <SidebarContent onClose={onClose} />
        </Drawer>
      )}

      {/* Desktop permanent */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid #DFDFDF',
            },
          }}
          open
        >
          <SidebarContent />
        </Drawer>
      )}
    </>
  );
}

export { SIDEBAR_WIDTH };
