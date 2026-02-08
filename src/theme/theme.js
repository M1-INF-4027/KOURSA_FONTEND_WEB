import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#001EA6',
      light: '#1E3FD8',
      dark: '#000D6B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F7B016',
      light: '#FFD54F',
      dark: '#C78C00',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#059669',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#DC2626',
    },
    warning: {
      main: '#F7B016',
      light: '#FEF3C7',
      dark: '#D97706',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#2563EB',
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#DFDFDF',
      300: '#D4D4D4',
      400: '#7E7E7E',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#131313',
      secondary: '#525252',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.875rem',
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(0, 30, 166, 0.25)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 30, 166, 0.35)',
          },
        },
        containedSecondary: {
          color: '#131313',
          boxShadow: '0 2px 8px rgba(247, 176, 22, 0.25)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(247, 176, 22, 0.35)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          border: '1px solid #DFDFDF',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: '#F5F7FA',
          color: '#525252',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
        },
      },
    },
  },
});

export default theme;
