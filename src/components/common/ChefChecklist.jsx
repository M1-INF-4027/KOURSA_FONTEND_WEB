import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, Skeleton, Button } from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { configurationService } from '../../api/services';

const GREEN = '#10B981';
const ORANGE = '#F7B016';

function ChecklistItem({ ok, label, doneCount, totalCount }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {ok ? (
          <CheckCircle sx={{ color: GREEN, fontSize: 22 }} />
        ) : (
          <Warning sx={{ color: ORANGE, fontSize: 22 }} />
        )}
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Chip
        label={`${doneCount} / ${totalCount}`}
        size="small"
        sx={{
          fontWeight: 600,
          bgcolor: ok ? `${GREEN}14` : `${ORANGE}14`,
          color: ok ? GREEN : ORANGE,
        }}
      />
    </Box>
  );
}

export default function ChefChecklist() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    configurationService
      .getChefChecklist()
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (error) return null;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={40} sx={{ mb: 1.5, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const uesOk = data.ues_sans_enseignant.length === 0;
  const niveauxOk = data.niveaux_sans_delegue.length === 0;
  const allGood = uesOk && niveauxOk;

  const uesDone = data.total_ues - data.ues_sans_enseignant.length;
  const niveauxDone = data.total_niveaux - data.niveaux_sans_delegue.length;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Checklist de votre departement
        </Typography>

        <ChecklistItem
          ok={uesOk}
          label="UEs avec enseignant"
          doneCount={uesDone}
          totalCount={data.total_ues}
        />
        <ChecklistItem
          ok={niveauxOk}
          label="Niveaux avec delegue"
          doneCount={niveauxDone}
          totalCount={data.total_niveaux}
        />

        {allGood ? (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${GREEN}14`,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: GREEN, fontWeight: 600 }}>
              Tout est en ordre
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {!uesOk && (
              <Button
                size="small"
                sx={{ textTransform: 'none', color: ORANGE, fontWeight: 600, justifyContent: 'flex-start' }}
                onClick={() => navigate('/admin/ues')}
              >
                Voir les UEs sans enseignant
              </Button>
            )}
            {!niveauxOk && (
              <Button
                size="small"
                sx={{ textTransform: 'none', color: ORANGE, fontWeight: 600, justifyContent: 'flex-start' }}
                onClick={() => navigate('/chef/delegues')}
              >
                Voir les niveaux
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
