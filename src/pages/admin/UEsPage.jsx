import { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import { Add, Edit, Delete, FileUpload, DeleteForever } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import ImportPanel from '../../components/common/ImportPanel';
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
  const [importFiliere, setImportFiliere] = useState('');
  const [importOuvert, setImportOuvert] = useState(false);
  // Deux fichiers distincts arrivent par ce meme bouton : le programme
  // (codes et intitules) et l'affectation des enseignants. Ils partagent
  // la colonne du code, d'ou la confusion possible entre les deux.
  const [importType, setImportType] = useState('ues');
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
            <Button variant="outlined" startIcon={<FileUpload />} onClick={() => setImportOuvert(true)}>
              Importer
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Ajouter
            </Button>
          </Box>
        }
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


      <Dialog
        open={importOuvert}
        onClose={() => setImportOuvert(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Importer des unites d&apos;enseignement</DialogTitle>
        <DialogContent>
        <TextField
          select
          size="small"
          fullWidth
          label="Que contient le fichier ?"
          value={importType}
          onChange={(e) => setImportType(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
        >
          <MenuItem value="ues">Programme : codes et intitules des UEs</MenuItem>
          <MenuItem value="affectations">Affectation des enseignants aux UEs</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label="Filiere des fichiers importes"
          value={importFiliere}
          onChange={(e) => setImportFiliere(e.target.value)}
          sx={{ mb: 2 }}
        >
          {filieres.map((f) => (
            <MenuItem key={f.id} value={f.id}>{f.nom_filiere}</MenuItem>
          ))}
        </TextField>

        {importType === 'ues' ? (
          <ImportPanel
            titre="Programme"
            description={
              'Le fichier est analyse par le serveur, puis presente pour verification '
              + 'avant tout enregistrement.'
            }
            colonnes={[
              { cle: 'code', requis: true, exemple: 'INF3111' },
              { cle: 'libelle', requis: true, exemple: 'Compilation' },
              { cle: 'semestre', exemple: '1' },
              { cle: 'niveau', exemple: 'L3' },
            ]}
            colonnesApercu={[
              { cle: 'code', libelle: 'Code' },
              { cle: 'libelle', libelle: 'Libelle' },
              { cle: 'semestre', libelle: 'Sem.' },
              { cle: 'niveau', libelle: 'Niveau' },
            ]}
            avertissement={!importFiliere
              ? 'Choisissez la filiere ci-dessus : sans elle, les niveaux deduits des '
                + 'codes UE ne seront pas rattaches.'
              : undefined}
            onSimuler={(file) => unitesEnseignementService.simuler(file, { filiere: importFiliere })}
            onValiderLignes={(rows) =>
              unitesEnseignementService.importerLignes(rows, { filiere: importFiliere })
            }
            onDone={load}
          />
        ) : (
          <ImportPanel
            titre="Affectation des enseignants"
            description={
              "Rattache des enseignants a des UEs deja creees. Aucune UE n'est "
              + 'creee par cet import.'
            }
            colonnes={[
              { cle: 'code_ue', requis: true, exemple: 'INF3111' },
              { cle: 'enseignant_email', requis: true, exemple: 'a.etoundi@ict4d.cm' },
              { cle: 'enseignant_nom', exemple: 'ATSA' },
              { cle: 'semestre', exemple: '1' },
            ]}
            colonnesApercu={[
              { cle: 'code', libelle: 'Code UE' },
              { cle: 'enseignant_email', libelle: 'Email' },
              { cle: 'enseignant', libelle: 'Nom' },
            ]}
            parentLibelle="Enseignant"
            parentOptions={enseignants.map((e) => ({
              id: e.id,
              libelle: `${e.first_name} ${e.last_name} — ${e.email}`,
            }))}
            autoriserCreationParent={false}
            prerequis={[
              { libelle: `${items.length} UE(s)`, ok: items.length > 0 },
              { libelle: `${enseignants.length} enseignant(s)`, ok: enseignants.length > 0 },
            ]}
            onSimuler={(file) =>
              unitesEnseignementService.simulerAffectations(file, { filiere: importFiliere })
            }
            onValiderLignes={(rows) =>
              unitesEnseignementService.importerAffectationsLignes(rows, { filiere: importFiliere })
            }
            onDone={load}
          />
        )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOuvert(false)} color="inherit">Fermer</Button>
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
    </Box>
  );
}
