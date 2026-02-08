import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';
import { authService } from '../../api/services';

export default function PasswordDialog({ open, onClose, onConfirm, title = 'Confirmer votre mot de passe' }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.confirmPassword(password);
      onConfirm(res.data.validation_token);
      setPassword('');
      onClose();
    } catch {
      setError('Mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mt: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><LockIcon sx={{ color: '#7E7E7E' }} /></InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          onKeyDown={(e) => e.key === 'Enter' && password && handleConfirm()}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">Annuler</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!password || loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Confirmer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
