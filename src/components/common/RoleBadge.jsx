import { Chip } from '@mui/material';

const roleConfig = {
  'Super Administrateur': { label: 'Super Admin', color: '#EF4444', bgcolor: '#FEE2E2' },
  'Chef de Département': { label: 'Chef Dept.', color: '#7C3AED', bgcolor: '#EDE9FE' },
  'Enseignant': { label: 'Enseignant', color: '#001EA6', bgcolor: '#EEF0FF' },
  'Délégué': { label: 'Delegue', color: '#10B981', bgcolor: '#D1FAE5' },
};

export default function RoleBadge({ role, size = 'small' }) {
  const config = roleConfig[role] || { label: role, color: '#7E7E7E', bgcolor: '#F5F5F5' };

  return (
    <Chip
      label={config.label}
      size={size}
      sx={{
        color: config.color,
        bgcolor: config.bgcolor,
        fontWeight: 600,
        fontSize: '0.7rem',
        border: 'none',
      }}
    />
  );
}
