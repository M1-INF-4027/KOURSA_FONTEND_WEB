import { createTheme } from '@mui/material/styles';

/**
 * Theme de la page d'accueil publique.
 *
 * Il prolonge celui de l'application — l'outremer #001EA6 reste la couleur
 * directrice — en lui adjoignant les teintes qui l'accompagnent sans lui
 * disputer la vedette : un ocre assombri, un vert sourd pour la validation,
 * une brique pour le refus, une craie bleutee pour les fonds alternes.
 *
 * L'or du produit (#F7B016) eclaire bien une pastille de statut, mais tire
 * vers le criard des qu'il couvre une surface. D'ou l'ocre, qui est le meme
 * ton pousse vers l'ombre.
 *
 * Aucun degrade : les surfaces sont des aplats, conformement a la demande et
 * aux usages de Material Design, qui distingue les plans par la teinte et
 * l'elevation plutot que par des fondus.
 */
const OUTREMER = '#001EA6';
const ENCRE = '#0A1240';

const landingTheme = createTheme({
  palette: {
    primary: { main: OUTREMER, dark: '#000D6B', light: '#1E3FD8', contrastText: '#FFFFFF' },
    secondary: { main: '#C88A04', dark: '#9A6A00', light: '#F7B016', contrastText: '#FFFFFF' },
    success: { main: '#0F7A5A', light: '#DCEFE8' },
    error: { main: '#B3352E', light: '#F7E3E1' },
    warning: { main: '#C88A04', light: '#FBF0D8' },
    text: { primary: ENCRE, secondary: '#4C5687' },
    divider: '#DCE2F4',
    background: { default: '#FFFFFF', paper: '#FFFFFF' },
    // Fond alterne : une craie bleutee, parente de l'outremer, plutot que le
    // gris neutre de tous les tableaux de bord.
    craie: { main: '#EFF2FB', contrastText: ENCRE },
  },

  // Echelle typographique de Material Design 3, adaptee a deux familles :
  // Bricolage Grotesque porte les titres, Inter le texte courant.
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h1: {
      fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
      fontWeight: 700,
      lineHeight: 1.06,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
      fontWeight: 700,
      lineHeight: 1.14,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontFamily: '"Bricolage Grotesque", "Inter", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '0.9375rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // 48 dp de hauteur utile : la cible tactile minimale de Material.
        root: { borderRadius: 10, paddingInline: 24, minHeight: 48 },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 16 } },
    },
  },
});

export default landingTheme;
