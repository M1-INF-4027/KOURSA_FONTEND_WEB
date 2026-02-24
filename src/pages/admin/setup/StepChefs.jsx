import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  Skeleton,
  Chip,
} from '@mui/material';
import { School, CheckCircle } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { departementsService, usersService } from '../../../api/services';

export default function StepChefs({ onComplete, onBack }) {
  const [departements, setDepartements] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDep, setSavingDep] = useState({});

  const load = async () => {
    try {
      const [depRes, usrRes] = await Promise.all([
        departementsService.getAll(),
        usersService.getAll(),
      ]);
      setDepartements(depRes.data);

      const enseignantsList = usrRes.data.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      );
      setEnseignants(enseignantsList);

      // Initialize assignments from existing data
      const initialAssignments = {};
      depRes.data.forEach((dep) => {
        if (dep.chef_departement) {
          const chef = enseignantsList.find((e) => e.id === dep.chef_departement);
          if (chef) {
            initialAssignments[dep.id] = chef;
          }
        }
      });
      setAssignments(initialAssignments);
    } catch {
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async (depId, enseignant) => {
    const previous = assignments[depId];

    // Update UI immediately
    setAssignments((prev) => {
      const next = { ...prev };
      if (enseignant) {
        next[depId] = enseignant;
      } else {
        delete next[depId];
      }
      return next;
    });

    // Save to backend
    setSavingDep((prev) => ({ ...prev, [depId]: true }));
    try {
      await departementsService.update(depId, {
        chef_departement: enseignant ? enseignant.id : null,
      });
      toast.success(
        enseignant
          ? `${enseignant.first_name} ${enseignant.last_name} assigne comme chef`
          : 'Chef de departement retire'
      );
    } catch {
      // Revert on error
      setAssignments((prev) => {
        const next = { ...prev };
        if (previous) {
          next[depId] = previous;
        } else {
          delete next[depId];
        }
        return next;
      });
      toast.error('Erreur lors de l\'assignation');
    } finally {
      setSavingDep((prev) => ({ ...prev, [depId]: false }));
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onComplete();
    } catch {
      // onComplete handles its own errors
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = Object.keys(assignments).length;
  const totalDeps = departements.length;

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={80} sx={{ mb: 1.5, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={80} sx={{ mb: 1.5, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Chefs de departement
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Assignez un chef a chaque departement. Les chefs de departement pourront valider les fiches de suivi et gerer les delegues.
      </Typography>
      <Chip
        icon={<CheckCircle />}
        label={`${assignedCount} / ${totalDeps} departement(s) assigne(s)`}
        color={assignedCount === totalDeps ? 'success' : 'default'}
        variant="outlined"
        sx={{ mb: 3 }}
      />

      {departements.length === 0 && (
        <Card sx={{ mb: 2, bgcolor: '#F5F7FA' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <School sx={{ fontSize: 48, color: '#7E7E7E', mb: 1 }} />
            <Typography color="text.secondary">
              Aucun departement trouve. Retournez aux etapes precedentes.
            </Typography>
          </CardContent>
        </Card>
      )}

      {departements.map((dep) => {
        const currentChef = assignments[dep.id] || null;
        const isSaving = savingDep[dep.id] || false;

        // Get enseignants that are not already assigned to another department
        const availableEnseignants = enseignants.filter((e) => {
          const assignedTo = Object.entries(assignments).find(
            ([dId, chef]) => chef.id === e.id && Number(dId) !== dep.id
          );
          return !assignedTo;
        });

        return (
          <Card key={dep.id} sx={{ mb: 1.5 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <School sx={{ color: '#001EA6' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {dep.nom_departement}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dep.nom_faculte || 'Faculte'}
                  </Typography>
                </Box>
                {currentChef && (
                  <Chip
                    label="Assigne"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                )}
              </Box>

              <Autocomplete
                options={availableEnseignants}
                getOptionLabel={(o) =>
                  typeof o === 'object'
                    ? `${o.first_name} ${o.last_name} (${o.email})`
                    : String(o)
                }
                value={currentChef}
                onChange={(_, val) => handleAssign(dep.id, val)}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                loading={isSaving}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chef de departement"
                    size="small"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSaving ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                noOptionsText="Aucun enseignant disponible"
              />
            </CardContent>
          </Card>
        );
      })}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>
          Precedent
        </Button>
        <Button
          variant="contained"
          onClick={handleComplete}
          disabled={saving}
          sx={{
            minWidth: 220,
            bgcolor: '#10B981',
            '&:hover': { bgcolor: '#059669' },
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          {saving ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            'Terminer la configuration'
          )}
        </Button>
      </Box>
    </Box>
  );
}
