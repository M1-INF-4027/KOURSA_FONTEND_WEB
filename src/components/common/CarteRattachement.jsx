import { Alert, Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { School, Class as ClassIcon, HourglassEmpty } from '@mui/icons-material';

/**
 * Ce a quoi l'utilisateur est rattache cette annee.
 *
 * Le delegue y lit la classe qu'il represente, l'enseignant la liste de ses
 * cours et les niveaux qu'il couvre. L'API renvoyait ces deux informations
 * depuis longtemps — `classe` et `enseignements` sur /me/ — sans que rien ne
 * les affiche : le profil proposait meme au delegue de changer de classe sans
 * jamais lui montrer laquelle il occupait.
 *
 * Les deux champs sont bornes a l'annee active cote serveur.
 */
export default function CarteRattachement({ utilisateur }) {
  if (!utilisateur) return null;

  const { classe, enseignements, mandat } = utilisateur;
  const aQuelqueChose = classe || mandat || enseignements?.nombre_ues > 0;
  if (!aQuelqueChose) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Mon rattachement
          {mandat?.annee && (
            <Typography component="span" variant="body2" sx={{ color: '#7E7E7E', ml: 1 }}>
              {mandat.annee}
            </Typography>
          )}
        </Typography>

        {/* --- Delegue --------------------------------------------------- */}
        {classe && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <ClassIcon sx={{ color: '#001EA6' }} />
            <Box>
              <Typography variant="body2" sx={{ color: '#7E7E7E' }}>
                Classe representee
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {classe.libelle}
              </Typography>
            </Box>
          </Box>
        )}

        {mandat?.statut === 'EN_ATTENTE' && (
          <Alert severity="info" icon={<HourglassEmpty />} sx={{ mt: 1 }}>
            Vous avez declare representer <strong>{mandat.libelle}</strong>. Le chef de
            departement doit la valider avant que vous puissiez soumettre des fiches.
          </Alert>
        )}

        {mandat?.a_renouveler && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {mandat.statut === 'REFUSE'
              ? `Votre classe a ete refusee : ${mandat.motif_refus || 'aucun motif'}. Declarez-en une autre.`
              : `L'annee ${mandat.annee} a commence. Indiquez la classe que vous representez cette annee.`}
          </Alert>
        )}

        {/* --- Enseignant ------------------------------------------------ */}
        {enseignements?.nombre_ues > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <School sx={{ color: '#0F7A5A' }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#7E7E7E' }}>
                  Cours assures cette annee
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {enseignements.nombre_ues} unite(s) d&apos;enseignement
                  {enseignements.niveaux?.length > 0
                    && ` — ${enseignements.niveaux.join(', ')}`}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {enseignements.ues.map((ue) => (
                <Chip
                  key={ue.id}
                  size="small"
                  label={ue.code}
                  title={ue.libelle}
                  sx={{ bgcolor: '#E8ECFB', color: '#001EA6', fontWeight: 600 }}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
