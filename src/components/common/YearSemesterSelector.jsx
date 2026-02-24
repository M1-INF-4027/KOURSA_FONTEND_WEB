import { useState } from 'react';
import { Chip, Menu, MenuItem, CircularProgress } from '@mui/material';
import { CalendarMonth, ArrowDropDown } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useConfig } from '../../contexts/ConfigContext';
import { useRoles } from '../../hooks/useRoles';
import { configurationService } from '../../api/services';

const PRIMARY = '#001EA6';

export default function YearSemesterSelector() {
  const { anneeActive, semestreActif, refresh } = useConfig();
  const { isAdmin } = useRoles();

  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);

  if (!anneeActive) return null;

  const semestres = anneeActive.semestres || [];
  const label = `${anneeActive.libelle} — S${semestreActif?.numero || '?'}`;

  const handleClick = (e) => {
    if (isAdmin && semestres.length > 0) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleSwitch = async (semestre) => {
    handleClose();
    if (semestre.id === semestreActif?.id) return;

    setLoading(true);
    try {
      await configurationService.activerSemestre(semestre.id);
      await refresh();
      toast.success(`Semestre ${semestre.numero} active`);
      window.location.reload();
    } catch {
      toast.error('Erreur lors du changement de semestre');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Chip
        icon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CalendarMonth sx={{ fontSize: 18 }} />}
        label={label}
        deleteIcon={isAdmin && semestres.length > 0 ? <ArrowDropDown sx={{ color: '#fff !important' }} /> : undefined}
        onDelete={isAdmin && semestres.length > 0 ? handleClick : undefined}
        onClick={handleClick}
        size="small"
        sx={{
          bgcolor: PRIMARY,
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: isAdmin ? 'pointer' : 'default',
          '& .MuiChip-icon': { color: '#fff' },
          '&:hover': { bgcolor: isAdmin ? '#001386' : PRIMARY },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160 } } }}
      >
        {semestres.map((s) => (
          <MenuItem
            key={s.id}
            selected={s.id === semestreActif?.id}
            onClick={() => handleSwitch(s)}
            sx={{ fontSize: '0.875rem' }}
          >
            Semestre {s.numero}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
