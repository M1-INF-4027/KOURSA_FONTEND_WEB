import { Chip } from '@mui/material';

const statusConfig = {
  SOUMISE: { label: 'Soumise', color: '#F7B016', bgcolor: '#FEF3C7' },
  VALIDEE: { label: 'Validee', color: '#059669', bgcolor: '#D1FAE5' },
  REFUSEE: { label: 'Refusee', color: '#DC2626', bgcolor: '#FEE2E2' },
  EN_ATTENTE: { label: 'En attente', color: '#7E7E7E', bgcolor: '#F5F5F5' },
  ACTIF: { label: 'Actif', color: '#059669', bgcolor: '#D1FAE5' },
  INACTIF: { label: 'Inactif', color: '#DC2626', bgcolor: '#FEE2E2' },
};

export default function StatusBadge({ status, size = 'small' }) {
  const config = statusConfig[status] || { label: status, color: '#7E7E7E', bgcolor: '#F5F5F5' };

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        color: config.color,
        bgcolor: config.bgcolor,
        fontWeight: 600,
        fontSize: '0.75rem',
        border: 'none',
      }}
    />
  );
}
