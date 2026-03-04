import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
} from '@mui/material';
import { ExpandMore, School as SchoolIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { unitesEnseignementService } from '../../api/services';
import toast from 'react-hot-toast';

export default function MesDeleguesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await unitesEnseignementService.getMesDelegues();
        setData(res.data);
      } catch {
        toast.error('Erreur lors du chargement des delegues');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3, mb: 2 }} />
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="Mes Delegues"
        description="Delegues des classes dans lesquelles vous enseignez"
      />

      {data.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState message="Aucun delegue trouve pour vos classes" />
          </CardContent>
        </Card>
      ) : (
        data.map((item, index) => (
          <Accordion key={item.niveau?.id || index} defaultExpanded sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SchoolIcon sx={{ color: '#001EA6' }} />
                <Typography sx={{ fontWeight: 600 }}>
                  {item.niveau?.filiere_nom} - {item.niveau?.nom_niveau}
                </Typography>
                <Chip
                  label={`${item.delegues?.length || 0} delegue(s)`}
                  size="small"
                  sx={{ bgcolor: 'rgba(0, 30, 166, 0.08)', color: '#001EA6', fontWeight: 600 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* UEs enseignees dans ce niveau */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#7E7E7E', mb: 1 }}>
                  UEs enseignees :
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {item.ues?.map((ue) => (
                    <Chip
                      key={ue.id}
                      label={`${ue.code_ue} - ${ue.libelle_ue}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              {/* Tableau des delegues */}
              {item.delegues?.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#7E7E7E', fontStyle: 'italic' }}>
                  Aucun delegue actif pour cette classe
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.delegues?.map((delegue) => (
                        <TableRow key={delegue.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{delegue.nom_complet}</TableCell>
                          <TableCell>{delegue.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
}
