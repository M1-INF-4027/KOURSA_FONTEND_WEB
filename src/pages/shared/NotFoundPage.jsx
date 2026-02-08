import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography variant="h1" sx={{ fontWeight: 800, color: '#001EA6', fontSize: '6rem', mb: 1 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Page introuvable
      </Typography>
      <Typography variant="body1" sx={{ color: '#7E7E7E', mb: 4, maxWidth: 400 }}>
        La page que vous recherchez n'existe pas ou a ete deplacee.
      </Typography>
      <Button
        variant="contained"
        startIcon={<HomeIcon />}
        onClick={() => navigate('/dashboard')}
      >
        Retour au dashboard
      </Button>
    </Box>
  );
}
