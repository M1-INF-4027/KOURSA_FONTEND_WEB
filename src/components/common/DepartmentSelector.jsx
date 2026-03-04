import { useState, useEffect } from 'react';
import { Card, CardContent, TextField, Skeleton } from '@mui/material';
import { departementsService } from '../../api/services';

export default function DepartmentSelector({ value, onChange, required = false, departments: externalDepts }) {
  const [departments, setDepartments] = useState(externalDepts || []);
  const [loading, setLoading] = useState(!externalDepts);

  useEffect(() => {
    if (externalDepts) {
      setDepartments(externalDepts);
      return;
    }
    departementsService.getAll()
      .then((res) => setDepartments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [externalDepts]);

  if (loading) {
    return <Skeleton variant="rounded" height={56} sx={{ mb: 2, borderRadius: 3 }} />;
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Departement"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || '')}
          SelectProps={{ native: true }}
        >
          {!required && <option value="">Tous les departements</option>}
          {required && !value && <option value="">-- Choisir un departement --</option>}
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nom_departement} ({d.nom_faculte || d.faculte_nom || 'N/A'})
            </option>
          ))}
        </TextField>
      </CardContent>
    </Card>
  );
}
