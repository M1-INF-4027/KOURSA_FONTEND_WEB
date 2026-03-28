import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Chip, Autocomplete, TextField, Skeleton,
  IconButton, Tooltip, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Typography, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { Edit, Add, Delete, FileUpload, Close, People as PeopleIcon, ExpandMore, School as SchoolIcon, Layers as LayersIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { unitesEnseignementService, usersService, niveauxService, semestresService, departementsService, filieresService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ChefUEsPage() {
  const { anneeActive, refreshKey } = useConfig();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign enseignants dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignEditing, setAssignEditing] = useState(null);
  const [formEnseignants, setFormEnseignants] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);

  // Create/Edit UE dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code_ue: '', libelle_ue: '', semestre_obj: '', niveaux: [] });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filiere filter for UE form
  const [filieres, setFilieres] = useState([]);
  const [formFiliere, setFormFiliere] = useState('');

  // Import CSV/Excel state
  const fileInputRef = useRef(null);
  const [importRows, setImportRows] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSemestre, setImportSemestre] = useState('');
  const [importNiveaux, setImportNiveaux] = useState([]);

  const load = async () => {
    try {
      // Determiner le departement du chef pour filtrer les niveaux
      const deptRes = await departementsService.getAll();
      const depts = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.results || [];
      const monDept = depts.find((d) => d.chef_departement === user?.id);
      const deptId = monDept?.id;

      const [ueRes, usrRes, nivRes, semRes, filRes] = await Promise.all([
        unitesEnseignementService.getAll(),
        usersService.getAll(),
        deptId
          ? niveauxService.getByDepartement(deptId)
          : niveauxService.getAll(),
        semestresService.getAll(anneeActive ? { annee_academique: anneeActive.id } : {}),
        filieresService.getAll(),
      ]);
      const ues = Array.isArray(ueRes.data) ? ueRes.data : ueRes.data?.results || [];
      const users = Array.isArray(usrRes.data) ? usrRes.data : usrRes.data?.results || [];
      setItems(ues);
      setEnseignants(users.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      ));
      setNiveaux(nivRes.data);
      const semData = Array.isArray(semRes.data?.results) ? semRes.data.results : (Array.isArray(semRes.data) ? semRes.data : []);
      setSemestres(semData);
      const filData = Array.isArray(filRes.data) ? filRes.data : filRes.data?.results || [];
      setFilieres(deptId ? filData.filter((f) => f.departement === deptId || f.departement_id === deptId) : filData);
    } catch {
      toast.error('Erreur chargement des UEs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  // --- Assign enseignants ---
  const handleOpenAssign = (item) => {
    setAssignEditing(item);
    const currentEnseignants = (item.enseignants_details || item.enseignants || [])
      .map((e) => typeof e === 'object' ? e : enseignants.find((x) => x.id === e))
      .filter(Boolean);
    setFormEnseignants(currentEnseignants);
    setAssignDialogOpen(true);
  };

  const handleSaveAssign = async () => {
    setAssignSaving(true);
    try {
      await unitesEnseignementService.update(assignEditing.id, {
        enseignants: formEnseignants.map((e) => e.id),
      });
      toast.success('Enseignants mis a jour');
      setAssignDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur sauvegarde');
    } finally {
      setAssignSaving(false);
    }
  };

  // --- Create / Edit UE ---
  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ code_ue: '', libelle_ue: '', semestre_obj: '', niveaux: [] });
    setFormFiliere('');
  };

  const handleOpen = (item = null) => {
    if (item && item.id) {
      setEditing(item);
      setForm({
        code_ue: item.code_ue || '',
        libelle_ue: item.libelle_ue || '',
        semestre_obj: item.semestre_obj || '',
        niveaux: item.niveaux || [],
      });
    } else {
      setEditing(null);
      setForm({ code_ue: '', libelle_ue: '', semestre_obj: semestres[0]?.id || '', niveaux: [] });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code_ue.trim() || !form.libelle_ue.trim()) return;
    setSaving(true);
    try {
      const data = {
        code_ue: form.code_ue.toUpperCase(),
        libelle_ue: form.libelle_ue,
        semestre_obj: form.semestre_obj || null,
        niveaux: form.niveaux.map((n) => (typeof n === 'object' ? n.id : n)),
      };
      if (editing && editing.id) {
        await unitesEnseignementService.update(editing.id, data);
        toast.success('UE modifiee');
      } else {
        await unitesEnseignementService.create(data);
        toast.success('UE creee');
      }
      handleClose();
      load();
    } catch (err) {
      const detail = err.response?.data;
      let msg = 'Erreur sauvegarde';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (detail?.detail) {
        msg = detail.detail;
      } else if (detail?.non_field_errors?.[0]) {
        msg = detail.non_field_errors[0];
      } else if (detail && typeof detail === 'object') {
        msg = Object.entries(detail).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' | ');
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    try {
      await unitesEnseignementService.delete(deleteId);
      toast.success('UE supprimee');
      setDeleteOpen(false);
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  // --- Import CSV/Excel logic ---
  const normalizeHeader = (h) => {
    const key = String(h).trim().toLowerCase().replace(/[\s_-]+/g, '_');
    if (['code', 'code_ue'].includes(key)) return 'code';
    if (['libelle', 'libelle_ue', 'libellé', 'libellé_ue'].includes(key)) return 'libelle';
    if (['semestre', 'semestre_obj', 'sem'].includes(key)) return 'semestre';
    return key;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!raw.length) {
          toast.error('Le fichier est vide');
          return;
        }

        const headerMap = {};
        Object.keys(raw[0]).forEach((h) => { headerMap[h] = normalizeHeader(h); });

        const rows = raw.map((row, idx) => {
          const mapped = {};
          Object.entries(row).forEach(([k, v]) => { mapped[headerMap[k]] = String(v).trim(); });
          return { _idx: idx, code: mapped.code || '', libelle: mapped.libelle || '', semestre: mapped.semestre || '' };
        });

        setImportRows(rows);
        setImportDialogOpen(true);
      } catch {
        toast.error('Impossible de lire le fichier');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeImportRow = (idx) => {
    setImportRows((prev) => prev.filter((r) => r._idx !== idx));
  };

  const isRowValid = (row) => row.code.trim() !== '' && row.libelle.trim() !== '';

  const resolveSemestre = (value) => {
    if (!value) return null;
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      const found = semestres.find((s) => s.numero === num);
      if (found) return found.id;
    }
    const lower = value.toLowerCase();
    const found = semestres.find((s) => String(s.numero) === lower || (s.libelle && s.libelle.toLowerCase().includes(lower)));
    return found ? found.id : null;
  };

  const handleImport = async () => {
    const validRows = importRows.filter(isRowValid);
    if (!validRows.length) return;

    setImporting(true);
    let created = 0;
    let updated = 0;
    let failed = 0;
    let lastError = '';

    // Build lookups for matching existing UEs
    // 1) Exact match: (code_ue, semestre_obj)  — same unique_together key
    // 2) Fallback: code_ue only — catches orphans with wrong/null semestre_obj
    const exactMap = {};
    const codeMap = {};
    items.forEach((ue) => {
      const codeLower = ue.code_ue.trim().toLowerCase();
      exactMap[`${codeLower}|${ue.semestre_obj || ''}`] = ue;
      if (!codeMap[codeLower]) codeMap[codeLower] = ue; // first match
    });

    for (const row of validRows) {
      try {
        const code = row.code.trim();
        const semestreId = resolveSemestre(row.semestre) || (importSemestre ? Number(importSemestre) : null);
        const sem = semestreId ? semestres.find((s) => s.id === semestreId) : null;
        const niveauIds = importNiveaux.map((n) => (typeof n === 'object' ? n.id : n));
        const data = {
          code_ue: code,
          libelle_ue: row.libelle.trim(),
          semestre_obj: semestreId,
          semestre: sem ? sem.numero : undefined,
          ...(niveauIds.length > 0 ? { niveaux: niveauIds } : {}),
        };

        const codeLower = code.toLowerCase();
        const existing = exactMap[`${codeLower}|${semestreId || ''}`] || codeMap[codeLower];
        if (existing) {
          // Merge niveaux: keep existing + add new
          if (niveauIds.length > 0) {
            const existingNiveaux = (existing.niveaux || []).map((n) => (typeof n === 'object' ? n.id : n));
            data.niveaux = [...new Set([...existingNiveaux, ...niveauIds])];
          }
          await unitesEnseignementService.update(existing.id, data);
          updated++;
        } else {
          await unitesEnseignementService.create(data);
          created++;
        }
      } catch (err) {
        failed++;
        const detail = err.response?.data;
        if (detail && typeof detail === 'object' && !lastError) {
          lastError = detail.detail || detail.non_field_errors?.[0]
            || Object.entries(detail).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join(' | ');
        }
      }
    }

    setImporting(false);
    setImportDialogOpen(false);
    setImportRows([]);
    setImportSemestre('');
    setImportNiveaux([]);

    const parts = [];
    if (created > 0) parts.push(`${created} creee(s)`);
    if (updated > 0) parts.push(`${updated} mise(s) a jour`);
    if (failed > 0) parts.push(`${failed} echouee(s)`);

    if (failed === 0) {
      toast.success(parts.join(', '));
    } else if (created > 0 || updated > 0) {
      toast.success(parts.join(', '));
      if (lastError) toast.error(lastError);
    } else {
      toast.error(lastError || `Import echoue (${failed} erreur(s))`);
    }

    load();
  };

  const validCount = importRows.filter(isRowValid).length;

  // View mode: 'hierarchy' or 'flat'
  const [viewMode, setViewMode] = useState('hierarchy');

  // Group UEs by filiere > niveau
  const groupedItems = useMemo(() => {
    const filiereMap = {};
    items.forEach((ue) => {
      const nivs = ue.niveaux_details || [];
      if (nivs.length === 0) {
        const key = 'Non classee';
        if (!filiereMap[key]) filiereMap[key] = { filiere: key, niveaux: { 'Sans niveau': [] } };
        if (!filiereMap[key].niveaux['Sans niveau']) filiereMap[key].niveaux['Sans niveau'] = [];
        filiereMap[key].niveaux['Sans niveau'].push(ue);
      } else {
        nivs.forEach((n) => {
          const filiere = n.filiere_nom || 'Sans filiere';
          const niveau = n.nom_niveau || 'Sans niveau';
          if (!filiereMap[filiere]) filiereMap[filiere] = { filiere, niveaux: {} };
          if (!filiereMap[filiere].niveaux[niveau]) filiereMap[filiere].niveaux[niveau] = [];
          // Avoid duplicates if same UE appears for multiple niveaux in same filiere
          if (!filiereMap[filiere].niveaux[niveau].find((u) => u.id === ue.id)) {
            filiereMap[filiere].niveaux[niveau].push(ue);
          }
        });
      }
    });
    return Object.values(filiereMap);
  }, [items]);

  const columns = [
    { field: 'code_ue', label: 'Code' },
    { field: 'libelle_ue', label: 'Libelle' },
    {
      field: 'semestre_info',
      label: 'Semestre',
      render: (r) => {
        const info = r.semestre_info;
        if (info) return <Chip label={`S${info.numero}`} size="small" variant="outlined" />;
        return '-';
      },
    },
    {
      field: 'niveaux',
      label: 'Classe',
      sortable: false,
      render: (r) => {
        const nivs = r.niveaux_details || r.niveaux || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {nivs.map((n, i) => (
              <Chip
                key={i}
                label={typeof n === 'object' ? `${n.filiere_nom || ''} ${n.nom_niveau}`.trim() : n}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'enseignants',
      label: 'Enseignants',
      sortable: false,
      render: (r) => {
        const names = r.enseignants_details || r.enseignants || [];
        if (names.length === 0) {
          return <Chip label="Aucun" size="small" sx={{ color: '#EF4444', bgcolor: '#FEE2E2', fontWeight: 600 }} />;
        }
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {names.map((e, i) => (
              <Chip
                key={i}
                label={typeof e === 'object' ? `${e.first_name} ${e.last_name}` : e}
                size="small"
              />
            ))}
          </Box>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      <PageHeader
        title="UEs du departement"
        description="Gerez les unites d'enseignement et les enseignants assignes"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FileUpload />} onClick={() => fileInputRef.current?.click()}>
              Importer
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Ajouter
            </Button>
          </Box>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        hidden
        onChange={handleFileSelect}
      />

      {/* View mode toggle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip
          label="Par filiere / niveau"
          icon={<SchoolIcon sx={{ fontSize: 18 }} />}
          onClick={() => setViewMode('hierarchy')}
          color={viewMode === 'hierarchy' ? 'primary' : 'default'}
          variant={viewMode === 'hierarchy' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Liste complete"
          icon={<LayersIcon sx={{ fontSize: 18 }} />}
          onClick={() => setViewMode('flat')}
          color={viewMode === 'flat' ? 'primary' : 'default'}
          variant={viewMode === 'flat' ? 'filled' : 'outlined'}
        />
      </Box>

      {viewMode === 'hierarchy' ? (
        /* Hierarchical view: Filiere > Niveau > UEs */
        <Box>
          {groupedItems.map((group) => (
            <Accordion key={group.filiere} defaultExpanded sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: '#F8F9FA' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SchoolIcon sx={{ color: '#001EA6' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{group.filiere}</Typography>
                  <Chip
                    label={`${Object.values(group.niveaux).flat().length} UE(s)`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {Object.entries(group.niveaux).map(([niveau, ues]) => (
                  <Box key={niveau}>
                    <Box sx={{ px: 3, py: 1.5, bgcolor: '#F0F4FF', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LayersIcon sx={{ fontSize: 18, color: '#525252' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#525252' }}>{niveau}</Typography>
                      <Chip label={`${ues.length}`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Libelle</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Semestre</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Enseignants</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ues.map((ue) => {
                          const ensNames = ue.enseignants_details || [];
                          const semInfo = ue.semestre_info;
                          return (
                            <TableRow key={ue.id} hover>
                              <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{ue.code_ue}</Typography></TableCell>
                              <TableCell>{ue.libelle_ue}</TableCell>
                              <TableCell>{semInfo ? <Chip label={`S${semInfo.numero}`} size="small" variant="outlined" /> : '-'}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {ensNames.length === 0 ? (
                                    <Chip label="Aucun" size="small" sx={{ color: '#EF4444', bgcolor: '#FEE2E2', fontWeight: 600 }} />
                                  ) : ensNames.map((e, i) => (
                                    <Chip key={i} label={`${e.first_name} ${e.last_name}`} size="small" />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="Modifier"><IconButton size="small" onClick={() => handleOpen(ue)}><Edit fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Enseignants"><IconButton size="small" onClick={() => handleOpenAssign(ue)}><PeopleIcon fontSize="small" /></IconButton></Tooltip>
                                <Tooltip title="Supprimer"><IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => { setDeleteId(ue.id); setDeleteOpen(true); }}><Delete fontSize="small" /></IconButton></Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
          {groupedItems.length === 0 && (
            <Card><CardContent sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">Aucune UE</Typography></CardContent></Card>
          )}
        </Box>
      ) : (
        /* Flat view: DataTable */
        <Card>
          <CardContent sx={{ p: 0 }}>
            <DataTable
              columns={columns}
              rows={items}
              searchFields={['code_ue', 'libelle_ue']}
              actions={(row) => (
                <>
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => handleOpen(row)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Assigner des enseignants">
                    <IconButton size="small" onClick={() => handleOpenAssign(row)}>
                      <PeopleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => { setDeleteId(row.id); setDeleteOpen(true); }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Assign enseignants dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Assigner des enseignants — {assignEditing?.code_ue}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Chip label={assignEditing?.libelle_ue} variant="outlined" />
          </Box>
          <Autocomplete
            multiple
            options={enseignants}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.first_name} ${o.last_name} (${o.email})` : String(o)}
            value={formEnseignants}
            onChange={(_, val) => setFormEnseignants(val)}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Enseignants" />}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)} color="inherit">Annuler</Button>
          <Button onClick={handleSaveAssign} variant="contained" disabled={assignSaving}>
            {assignSaving ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit UE dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Modifier l'UE" : 'Nouvelle UE'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Code UE"
            fullWidth
            value={form.code_ue}
            onChange={(e) => setForm({ ...form, code_ue: e.target.value.toUpperCase() })}
            inputProps={{ style: { textTransform: 'uppercase' } }}
          />
          <TextField
            label="Libelle"
            fullWidth
            value={form.libelle_ue}
            onChange={(e) => setForm({ ...form, libelle_ue: e.target.value })}
          />
          <TextField
            select
            label="Semestre"
            fullWidth
            value={form.semestre_obj}
            onChange={(e) => setForm({ ...form, semestre_obj: e.target.value })}
          >
            {semestres.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                Semestre {s.numero}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Filtrer par filiere"
            fullWidth
            value={formFiliere}
            onChange={(e) => setFormFiliere(e.target.value)}
          >
            <MenuItem value="">Toutes les filieres</MenuItem>
            {filieres.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.nom_filiere}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            multiple
            options={formFiliere
              ? niveaux.filter((n) => (n.filiere || n.filiere_id) === Number(formFiliere))
              : niveaux
            }
            getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
            value={form.niveaux.map((n) => typeof n === 'object' ? n : niveaux.find((x) => x.id === n) || n)}
            onChange={(_, val) => setForm({ ...form, niveaux: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label={`Niveaux${formFiliere ? ' (filtre par filiere)' : ''}`} />}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.code_ue.trim() || !form.libelle_ue.trim()}>
            {saving ? 'Sauvegarde...' : (editing ? 'Modifier' : 'Creer')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Supprimer l'UE"
        message="Etes-vous sur de vouloir supprimer cette unite d'enseignement ?"
        confirmText="Supprimer"
        confirmColor="error"
      />

      {/* Import preview dialog */}
      <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Apercu de l&apos;import ({importRows.length} ligne{importRows.length > 1 ? 's' : ''})
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            <TextField
              select
              size="small"
              label="Semestre par defaut (applique si absent du fichier)"
              fullWidth
              value={importSemestre}
              onChange={(e) => setImportSemestre(e.target.value)}
            >
              <MenuItem value="">-- Aucun --</MenuItem>
              {semestres.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  Semestre {s.numero}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              size="small"
              options={niveaux}
              getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
              value={importNiveaux}
              onChange={(_, val) => setImportNiveaux(val)}
              isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
              renderInput={(params) => <TextField {...params} label="Classe (optionnel)" />}
              sx={{ mt: 1.5 }}
            />
          </Box>
          {importRows.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Aucune ligne</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Libelle</TableCell>
                  <TableCell>Semestre</TableCell>
                  <TableCell align="center" sx={{ width: 80 }}>Statut</TableCell>
                  <TableCell align="center" sx={{ width: 50 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {importRows.map((row) => {
                  const valid = isRowValid(row);
                  return (
                    <TableRow key={row._idx} sx={!valid ? { bgcolor: 'error.50' } : undefined}>
                      <TableCell>{row.code || <Typography variant="body2" color="error">Manquant</Typography>}</TableCell>
                      <TableCell>{row.libelle || <Typography variant="body2" color="error">Manquant</Typography>}</TableCell>
                      <TableCell>{row.semestre || '-'}</TableCell>
                      <TableCell align="center">
                        {valid ? (
                          <Chip label="OK" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="Invalide" size="small" color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => removeImportRow(row._idx)} disabled={importing}>
                          <Close fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit" disabled={importing}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={importing || validCount === 0}
            startIcon={importing ? <CircularProgress size={18} color="inherit" /> : <FileUpload />}
          >
            {importing ? 'Import en cours...' : `Importer ${validCount} UE(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
