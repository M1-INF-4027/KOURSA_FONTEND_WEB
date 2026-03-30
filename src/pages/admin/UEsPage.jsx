import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Skeleton,
  Chip,
  Autocomplete,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, FileUpload, Close, DeleteForever } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DepartmentSelector from '../../components/common/DepartmentSelector';
import { unitesEnseignementService, usersService, niveauxService, semestresService, departementsService, filieresService } from '../../api/services';
import { useConfig } from '../../contexts/ConfigContext';
import toast from 'react-hot-toast';

export default function UEsPage() {
  const { anneeActive, refreshKey } = useConfig();
  const [items, setItems] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code_ue: '', libelle_ue: '', semestre_obj: '', enseignants: [], niveaux: [] });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Department filter
  const [selectedDept, setSelectedDept] = useState('');
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [formFiliere, setFormFiliere] = useState('');

  // Import CSV/Excel state
  const fileInputRef = useRef(null);
  const [importRows, setImportRows] = useState([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSemestre, setImportSemestre] = useState('');
  const [importNiveaux, setImportNiveaux] = useState([]);
  const [importFiliere, setImportFiliere] = useState('');
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const load = async () => {
    try {
      const [ueRes, usrRes, nivRes, semRes, deptRes, filRes] = await Promise.all([
        unitesEnseignementService.getAll(),
        usersService.getAll(),
        niveauxService.getAll(),
        semestresService.getAll(anneeActive ? { annee_academique: anneeActive.id } : {}),
        departementsService.getAll(),
        filieresService.getAll(),
      ]);
      setItems(ueRes.data);
      setEnseignants(usrRes.data.filter((u) =>
        u.roles?.some((r) => (r.nom_role || r) === 'Enseignant')
      ));
      setNiveaux(nivRes.data);
      const semData = Array.isArray(semRes.data?.results) ? semRes.data.results : (Array.isArray(semRes.data) ? semRes.data : []);
      setSemestres(semData);
      setDepartments(deptRes.data);
      setFilieres(filRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Session expiree, veuillez vous reconnecter');
      } else {
        toast.error('Erreur chargement des donnees');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  // Filter UEs by department (client-side via niveaux_details filiere_nom)
  const filteredItems = useMemo(() => {
    if (!selectedDept) return items;
    const deptFiliereNames = filieres
      .filter((f) => f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
      .map((f) => f.nom_filiere);
    return items.filter((ue) => {
      const nivs = ue.niveaux_details || [];
      return nivs.some((nd) => deptFiliereNames.includes(nd.filiere_nom));
    });
  }, [items, selectedDept, filieres]);

  // Filter niveaux by selected department for dialogs
  const filteredNiveaux = useMemo(() => {
    if (!selectedDept) return niveaux;
    const deptFiliereIds = filieres
      .filter((f) => f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
      .map((f) => f.id);
    return niveaux.filter((n) => deptFiliereIds.includes(n.filiere || n.filiere_id));
  }, [niveaux, selectedDept, filieres]);

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ code_ue: '', libelle_ue: '', semestre_obj: '', enseignants: [], niveaux: [] });
  };

  const handleOpen = (item = null) => {
    if (item && item.id) {
      setEditing(item);
      setForm({
        code_ue: item.code_ue || '',
        libelle_ue: item.libelle_ue || '',
        semestre_obj: item.semestre_obj || '',
        enseignants: item.enseignants || [],
        niveaux: item.niveaux || [],
      });
    } else {
      setEditing(null);
      setForm({ code_ue: '', libelle_ue: '', semestre_obj: semestres[0]?.id || '', enseignants: [], niveaux: [] });
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
        enseignants: form.enseignants.map((e) => (typeof e === 'object' ? e.id : e)),
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

  const handleDelete = async () => {
    try {
      await unitesEnseignementService.delete(deleteId);
      toast.success('UE supprimee');
      setDeleteOpen(false);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await unitesEnseignementService.deleteAll();
      toast.success(`${res.data.deleted} UE(s) supprimee(s)`);
      setDeleteAllOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // --- Import CSV/Excel logic ---
  const normalizeHeader = (h) => {
    const key = String(h).trim().toLowerCase().replace(/[\s_-]+/g, '_');
    if (['code', 'code_ue', 'codes_2025_2026', 'code_ue_intitulé'].includes(key)) return 'code';
    if (['libelle', 'libelle_ue', 'libellé', 'libellé_ue', 'intitulé', 'intitule'].includes(key)) return 'libelle';
    if (['semestre', 'semestre_obj', 'sem'].includes(key)) return 'semestre';
    if (['niveau'].includes(key)) return 'niveau';
    if (['enseignant'].includes(key)) return 'enseignant';
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
          return {
            _idx: idx,
            code: mapped.code || '',
            libelle: mapped.libelle || '',
            semestre: mapped.semestre || '',
            niveau: mapped.niveau || '',
            enseignant: mapped.enseignant || '',
          };
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

  // Detecte le niveau a partir du code UE (ex: INF352 → 3 → L3, INF4235 → 4 → M1)
  const detectNiveauFromCode = (code) => {
    // Cherche le premier chiffre apres les lettres : INF3xx → 3, ICT4xx → 4
    const match = code.match(/^[A-Za-z]+(\d)/);
    if (!match) return null;
    const digit = parseInt(match[1], 10);
    // 1→L1, 2→L2, 3→L3, 4→M1, 5→M2
    const niveauMap = { 1: 'L1', 2: 'L2', 3: 'L3', 4: 'M1', 5: 'M2' };
    return niveauMap[digit] || null;
  };

  const resolveNiveauForCode = (code, filiereId) => {
    if (!filiereId || !code) return null;
    const niveauName = detectNiveauFromCode(code);
    if (!niveauName) return null;
    return niveaux.find(
      (n) => n.nom_niveau === niveauName && (n.filiere === Number(filiereId) || n.filiere_id === Number(filiereId))
    ) || null;
  };

  // Resolve niveau from explicit column value (e.g. "L1", "M2") + filiere
  const resolveNiveauFromColumn = (niveauStr, filiereId) => {
    if (!niveauStr || !filiereId) return null;
    const cleaned = niveauStr.trim().toUpperCase();
    return niveaux.find(
      (n) => n.nom_niveau === cleaned && (n.filiere === Number(filiereId) || n.filiere_id === Number(filiereId))
    ) || null;
  };

  // Match enseignant by partial name (case-insensitive)
  const resolveEnseignant = (name) => {
    if (!name) return null;
    const lower = name.trim().toLowerCase();
    if (!lower) return null;
    return enseignants.find((e) => {
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
      const lastName = (e.last_name || '').toLowerCase();
      return fullName.includes(lower) || lastName.includes(lower) || lower.includes(lastName);
    }) || null;
  };

  const resolveSemestre = (value) => {
    if (!value) return null;
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      const found = semestres.find((s) => s.numero === num);
      if (found) return found.id;
    }
    // Try matching by string
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
      if (!codeMap[codeLower]) codeMap[codeLower] = ue;
    });

    for (const row of validRows) {
      try {
        const code = row.code.trim();
        const semestreId = resolveSemestre(row.semestre) || (importSemestre ? Number(importSemestre) : null);
        const sem = semestreId ? semestres.find((s) => s.id === semestreId) : null;

        // Niveaux: combine manual selection + auto from code + explicit column
        const manualNiveauIds = importNiveaux.map((n) => (typeof n === 'object' ? n.id : n));
        const autoNiveau = resolveNiveauForCode(code, importFiliere);
        const columnNiveau = resolveNiveauFromColumn(row.niveau, importFiliere);
        const allNiveauIds = [...new Set([
          ...manualNiveauIds,
          ...(autoNiveau ? [autoNiveau.id] : []),
          ...(columnNiveau ? [columnNiveau.id] : []),
        ])];

        // Enseignant: match by name (optional)
        const matchedEnseignant = resolveEnseignant(row.enseignant);
        const enseignantIds = matchedEnseignant ? [matchedEnseignant.id] : [];

        const data = {
          code_ue: code,
          libelle_ue: row.libelle.trim(),
          semestre_obj: semestreId,
          semestre: sem ? sem.numero : undefined,
          ...(allNiveauIds.length > 0 ? { niveaux: allNiveauIds } : {}),
        };

        const codeLower = code.toLowerCase();
        const existing = exactMap[`${codeLower}|${semestreId || ''}`] || codeMap[codeLower];
        if (existing) {
          const existingNiveaux = (existing.niveaux || []).map((n) => (typeof n === 'object' ? n.id : n));
          data.niveaux = [...new Set([...existingNiveaux, ...allNiveauIds])];
          if (enseignantIds.length > 0) {
            const existingEns = (existing.enseignants || []).map((e) => (typeof e === 'object' ? e.id : e));
            data.enseignants = [...new Set([...existingEns, ...enseignantIds])];
          }
          await unitesEnseignementService.update(existing.id, data);
          updated++;
        } else {
          if (enseignantIds.length > 0) data.enseignants = enseignantIds;
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
    setImportFiliere('');

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
      field: 'enseignants',
      label: 'Enseignants',
      sortable: false,
      render: (r) => {
        const names = r.enseignants_details || r.enseignants || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {names.slice(0, 2).map((e, i) => (
              <Chip key={i} label={typeof e === 'object' ? `${e.first_name} ${e.last_name}` : e} size="small" />
            ))}
            {names.length > 2 && <Chip label={`+${names.length - 2}`} size="small" />}
          </Box>
        );
      },
    },
    {
      field: 'niveaux',
      label: 'Niveaux',
      sortable: false,
      render: (r) => {
        const nivs = r.niveaux_details || r.niveaux || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {nivs.slice(0, 2).map((n, i) => (
              <Chip key={i} label={typeof n === 'object' ? `${n.filiere_nom || ''} ${n.nom_niveau}`.trim() : n} size="small" variant="outlined" />
            ))}
            {nivs.length > 2 && <Chip label={`+${nivs.length - 2}`} size="small" variant="outlined" />}
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
        title="Unites d'enseignement"
        description="Gestion des UEs"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {items.length > 0 && (
              <Button variant="outlined" color="error" startIcon={<DeleteForever />} onClick={() => setDeleteAllOpen(true)}>
                Tout supprimer
              </Button>
            )}
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

      <DepartmentSelector value={selectedDept} onChange={setSelectedDept} departments={departments} />

      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            rows={filteredItems}
            searchFields={['code_ue', 'libelle_ue']}
            actions={(row) => (
              <>
                <Tooltip title="Modifier">
                  <IconButton size="small" onClick={() => handleOpen(row)}>
                    <Edit fontSize="small" />
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

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Modifier l\'UE' : 'Nouvelle UE'}
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
          <Autocomplete
            multiple
            options={enseignants}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.first_name} ${o.last_name}` : String(o)}
            value={form.enseignants.map((e) => typeof e === 'object' ? e : enseignants.find((x) => x.id === e) || e)}
            onChange={(_, val) => setForm({ ...form, enseignants: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label="Enseignants" />}
          />
          <TextField
            select
            label="Filtrer par filiere"
            fullWidth
            value={formFiliere}
            onChange={(e) => setFormFiliere(e.target.value)}
          >
            <MenuItem value="">Toutes les filieres</MenuItem>
            {filieres
              .filter((f) => !selectedDept || f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
              .map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.nom_filiere}
                </MenuItem>
              ))}
          </TextField>
          <Autocomplete
            multiple
            options={formFiliere
              ? filteredNiveaux.filter((n) => (n.filiere || n.filiere_id) === Number(formFiliere))
              : filteredNiveaux
            }
            getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
            value={form.niveaux.map((n) => typeof n === 'object' ? n : niveaux.find((x) => x.id === n) || n)}
            onChange={(_, val) => setForm({ ...form, niveaux: val })}
            isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
            renderInput={(params) => <TextField {...params} label={`Niveaux${formFiliere ? ' (filtre par filiere)' : selectedDept ? ' (filtre par departement)' : ''}`} />}
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
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'UE"
        message="Etes-vous sur de vouloir supprimer cette unite d'enseignement ?"
        confirmText="Supprimer"
        confirmColor="error"
      />

      <ConfirmDialog
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={handleDeleteAll}
        title="Supprimer toutes les UEs"
        message={`Etes-vous sur de vouloir supprimer les ${items.length} UE(s) ? Cette action est irreversible.`}
        confirmText="Tout supprimer"
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
            <TextField
              select
              size="small"
              label="Filiere (pour detection auto du niveau)"
              fullWidth
              value={importFiliere}
              onChange={(e) => setImportFiliere(e.target.value)}
              sx={{ mt: 1.5 }}
              helperText={importFiliere ? 'Le niveau sera detecte automatiquement depuis le code UE (ex: INF3xx → L3)' : ''}
            >
              <MenuItem value="">-- Aucune (pas de detection auto) --</MenuItem>
              {filieres
                .filter((f) => !selectedDept || f.departement === Number(selectedDept) || f.departement_id === Number(selectedDept))
                .map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nom_filiere}
                  </MenuItem>
                ))}
            </TextField>
            <Autocomplete
              multiple
              size="small"
              options={filteredNiveaux}
              getOptionLabel={(o) => typeof o === 'object' ? `${o.nom_filiere || o.filiere_nom || ''} ${o.nom_niveau}`.trim() : String(o)}
              value={importNiveaux}
              onChange={(_, val) => setImportNiveaux(val)}
              isOptionEqualToValue={(opt, val) => opt.id === (val?.id || val)}
              renderInput={(params) => <TextField {...params} label={`Niveaux supplementaires (optionnel)${selectedDept ? ' - filtre par departement' : ''}`} />}
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
                  {importRows.some((r) => r.niveau) && <TableCell>Niveau</TableCell>}
                  {importRows.some((r) => r.enseignant) && <TableCell>Enseignant</TableCell>}
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
                      {importRows.some((r) => r.niveau) && <TableCell>{row.niveau || '-'}</TableCell>}
                      {importRows.some((r) => r.enseignant) && (
                        <TableCell>
                          {row.enseignant ? (
                            resolveEnseignant(row.enseignant)
                              ? <Chip label={row.enseignant} size="small" color="success" variant="outlined" />
                              : <Tooltip title="Non trouve dans les utilisateurs"><Chip label={row.enseignant} size="small" color="warning" variant="outlined" /></Tooltip>
                          ) : '-'}
                        </TableCell>
                      )}
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
