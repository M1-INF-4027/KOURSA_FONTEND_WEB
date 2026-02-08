import { Box, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

export default function EmptyState({ message = 'Aucune donnee disponible', icon }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, color: '#7E7E7E' }}>
      <Box sx={{ mb: 2 }}>
        {icon || <InboxOutlined sx={{ fontSize: 64, color: '#DFDFDF' }} />}
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
}
