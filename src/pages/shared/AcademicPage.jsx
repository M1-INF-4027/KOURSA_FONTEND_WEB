import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Skeleton,
  Collapse, IconButton,
} from '@mui/material';
import {
  ExpandMore, ExpandLess,
  AccountBalance as FaculteIcon,
  Business as DeptIcon,
  AccountTree as FiliereIcon,
  School as NiveauIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import { facultesService, departementsService, filieresService, niveauxService } from '../../api/services';
import toast from 'react-hot-toast';

export default function AcademicPage() {
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFac, setExpandedFac] = useState(new Set());
  const [expandedDept, setExpandedDept] = useState(new Set());
  const [expandedFil, setExpandedFil] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const [facRes, depRes, filRes, nivRes] = await Promise.all([
          facultesService.getAll(),
          departementsService.getAll(),
          filieresService.getAll(),
          niveauxService.getAll(),
        ]);
        setFacultes(Array.isArray(facRes.data) ? facRes.data : facRes.data?.results || []);
        setDepartements(Array.isArray(depRes.data) ? depRes.data : depRes.data?.results || []);
        setFilieres(Array.isArray(filRes.data) ? filRes.data : filRes.data?.results || []);
        setNiveaux(Array.isArray(nivRes.data) ? nivRes.data : nivRes.data?.results || []);
      } catch {
        toast.error('Erreur chargement de la structure academique');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (set, setFn, id) => {
    setFn((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getDeptsByFac = (facId) => departements.filter((d) => d.faculte === facId);
  const getFilsByDept = (deptId) => filieres.filter((f) => f.departement === deptId);
  const getNivsByFil = (filId) => niveaux.filter((n) => n.filiere === filId);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5, borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="Structure academique"
        description="Organisation des facultes, departements, filieres et niveaux"
      />

      {facultes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FaculteIcon sx={{ fontSize: 48, color: '#DFDFDF', mb: 1 }} />
            <Typography color="text.secondary">Aucune structure academique configuree</Typography>
          </CardContent>
        </Card>
      ) : (
        facultes.map((fac) => {
          const depts = getDeptsByFac(fac.id);
          const isExpanded = expandedFac.has(fac.id);

          return (
            <Card key={fac.id} sx={{ mb: 1.5 }}>
              <CardContent
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5,
                  cursor: 'pointer', '&:last-child': { pb: 1.5 },
                }}
                onClick={() => toggle(expandedFac, setExpandedFac, fac.id)}
              >
                <FaculteIcon sx={{ color: '#001EA6' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {fac.nom_faculte}
                  </Typography>
                </Box>
                <Chip label={`${depts.length} dept.`} size="small" variant="outlined" />
                <IconButton size="small">
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </CardContent>

              <Collapse in={isExpanded}>
                <Box sx={{ px: 3, pb: 2 }}>
                  {depts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                      Aucun departement
                    </Typography>
                  ) : (
                    depts.map((dept) => {
                      const fils = getFilsByDept(dept.id);
                      const isDeptExpanded = expandedDept.has(dept.id);

                      return (
                        <Box key={dept.id} sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1, py: 1, pl: 1,
                              cursor: 'pointer', borderRadius: 1,
                              '&:hover': { bgcolor: '#F5F7FA' },
                            }}
                            onClick={() => toggle(expandedDept, setExpandedDept, dept.id)}
                          >
                            <DeptIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {dept.nom_departement}
                              </Typography>
                              {dept.nom_chef && (
                                <Typography variant="caption" color="text.secondary">
                                  Chef : {dept.nom_chef}
                                </Typography>
                              )}
                            </Box>
                            <Chip label={`${fils.length} fil.`} size="small" variant="outlined" />
                            <IconButton size="small">
                              {isDeptExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>

                          <Collapse in={isDeptExpanded}>
                            <Box sx={{ pl: 4 }}>
                              {fils.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                                  Aucune filiere
                                </Typography>
                              ) : (
                                fils.map((fil) => {
                                  const nivs = getNivsByFil(fil.id);
                                  const isFilExpanded = expandedFil.has(fil.id);

                                  return (
                                    <Box key={fil.id} sx={{ mb: 0.5 }}>
                                      <Box
                                        sx={{
                                          display: 'flex', alignItems: 'center', gap: 1, py: 0.5,
                                          cursor: 'pointer', borderRadius: 1,
                                          '&:hover': { bgcolor: '#F5F7FA' },
                                        }}
                                        onClick={() => toggle(expandedFil, setExpandedFil, fil.id)}
                                      >
                                        <FiliereIcon sx={{ color: '#3B82F6', fontSize: 18 }} />
                                        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                                          {fil.nom_filiere}
                                        </Typography>
                                        <Chip label={`${nivs.length} niv.`} size="small" variant="outlined" />
                                        <IconButton size="small">
                                          {isFilExpanded ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                      </Box>

                                      <Collapse in={isFilExpanded}>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', pl: 4, py: 1 }}>
                                          {nivs.length === 0 ? (
                                            <Typography variant="caption" color="text.secondary">
                                              Aucun niveau
                                            </Typography>
                                          ) : (
                                            nivs.map((niv) => (
                                              <Chip
                                                key={niv.id}
                                                icon={<NiveauIcon sx={{ fontSize: '14px !important' }} />}
                                                label={niv.nom_niveau}
                                                size="small"
                                                sx={{ bgcolor: '#D1FAE5', color: '#10B981', fontWeight: 600 }}
                                              />
                                            ))
                                          )}
                                        </Box>
                                      </Collapse>
                                    </Box>
                                  );
                                })
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Collapse>
            </Card>
          );
        })
      )}
    </Box>
  );
}
