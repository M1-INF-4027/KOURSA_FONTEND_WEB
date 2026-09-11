import { useEffect, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Fade,
  Grid,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircleRounded,
  ComputerRounded,
  PhoneAndroidRounded,
  ScheduleRounded,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import landingTheme from './landingTheme';
import './LandingPage.css';

/**
 * Page d'accueil publique, servie a la racine du domaine.
 *
 * Jusqu'ici la racine renvoyait au tableau de bord, donc a l'ecran de
 * connexion : un visiteur sans compte tombait sur un formulaire sans jamais
 * savoir ce qu'est Koursa. Cette page repond d'abord a cette question.
 *
 * Les donnees de la fiche et du releve sont des exemples. Les ecrans reels
 * portent des noms et des adresses d'enseignants, qui n'ont pas leur place
 * sur une page ouverte a tous.
 */

const CHAMPS_FICHE = [
  ['Date du cours', 'jeudi 12 mars 2026'],
  ['Horaire', '08 h 00 – 10 h 00'],
  ['Durée', '2 h 00'],
  ['Salle', 'A100'],
  ['Type de séance', 'Cours magistral'],
];

const ETAPES = [
  {
    titre: 'Le délégué déclare',
    texte: "À la sortie du cours, il saisit l'unité d'enseignement, la date, les "
      + 'horaires, la salle, le type de séance et le contenu abordé. La durée se '
      + 'calcule seule.',
  },
  {
    titre: "L'enseignant tranche",
    texte: 'Il retrouve la fiche parmi celles qui le concernent et la valide en un '
      + "clic. S'il la refuse, il en donne le motif : le délégué corrige et "
      + 'resoumet. Une fiche validée ne bouge plus.',
  },
  {
    titre: 'Le département compte',
    texte: 'Les heures validées alimentent le tableau de bord du chef de '
      + "département, qui voit avancer chaque unité d'enseignement et repère "
      + 'celles qui prennent du retard.',
  },
];

const ROLES = [
  {
    nom: 'Délégué',
    couleur: 'primary.main',
    texte: 'Soumet les fiches de sa classe, suit celles qui ont été validées et '
      + 'corrige celles qui ont été refusées.',
  },
  {
    nom: 'Enseignant',
    couleur: 'secondary.main',
    texte: "Retrouve les séances déclarées pour ses unités d'enseignement, valide "
      + 'ou refuse, et consulte le total de ses heures.',
  },
  {
    nom: 'Chef de département',
    couleur: 'success.main',
    texte: 'Approuve les inscriptions, surveille les heures validées du mois, '
      + 'repère les fiches en attente et exporte les bilans.',
  },
  {
    nom: 'Administrateur',
    couleur: 'text.secondary',
    texte: "Met en place l'année académique — filières, niveaux, salles, unités "
      + "d'enseignement, comptes — à la main ou en important des fichiers Excel, "
      + 'avec un aperçu avant enregistrement.',
  },
];

const RELEVE = [
  ['INF3111', '14', '28 h 00'],
  ['INF3112', '11', '22 h 00'],
  ['INF3121', '9', '19 h 30'],
  ['INF3122', '6', '12 h 00'],
];

/** Ecart vertical des sections, sur la trame de 8 dp de Material. */
const RESPIRATION = { xs: 7, md: 11 };

function TitreSection({ titre, chapeau }) {
  return (
    <Box sx={{ maxWidth: 640, mb: { xs: 5, md: 6 } }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' }, mb: 1.5 }}>
        {titre}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {chapeau}
      </Typography>
    </Box>
  );
}

/**
 * La fiche de suivi, telle qu'elle existe dans le produit.
 *
 * Elle passe une fois de « En attente » a « Validee ». C'est le geste central
 * de Koursa, et la seule animation de la page ; le mouvement est supprime pour
 * qui a demande a son systeme de les reduire.
 */
function FicheSuivi() {
  const mouvementReduit = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [validee, setValidee] = useState(mouvementReduit);

  useEffect(() => {
    if (mouvementReduit) return undefined;
    const minuteur = setTimeout(() => setValidee(true), 1400);
    return () => clearTimeout(minuteur);
  }, [mouvementReduit]);

  return (
    <Card sx={{ borderColor: 'transparent', boxShadow: '0 24px 48px -32px rgba(0,0,0,.55)' }}>
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Fiche de suivi pédagogique
        </Typography>
        <Typography variant="h3" sx={{ fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>
          INF3111
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Compilation
        </Typography>
      </Box>

      <Divider />

      <CardContent sx={{ px: 3, py: 1 }}>
        <Stack divider={<Divider />}>
          {CHAMPS_FICHE.map(([libelle, valeur]) => (
            <Stack
              key={libelle}
              direction={{ xs: 'column', sm: 'row' }}
              sx={{ py: 1.5, gap: { xs: 0.25, sm: 2 } }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', width: 150, flexShrink: 0 }}>
                {libelle}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {valeur}
              </Typography>
            </Stack>
          ))}
          <Box sx={{ py: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Contenu abordé
            </Typography>
            <Typography variant="body2">
              Analyse syntaxique descendante : grammaires LL(1), construction de la
              table d&apos;analyse, traitement des conflits.
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <Divider />

      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', minHeight: 76 }}>
        <Fade in={!validee} timeout={200} unmountOnExit>
          <Chip
            icon={<ScheduleRounded />}
            label="En attente de l'enseignant"
            sx={{
              bgcolor: 'warning.light',
              color: 'secondary.dark',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'secondary.main' },
            }}
          />
        </Fade>
        <Fade in={validee} timeout={400}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                icon={<CheckCircleRounded />}
                label="Validée"
                sx={{
                  bgcolor: 'success.light',
                  color: 'success.main',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'success.main' },
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
              >
                12.03.2026
              </Typography>
            </Stack>
          </Box>
        </Fade>
      </Box>
    </Card>
  );
}

export default function LandingPage({ sansRedirection = false }) {
  const { isAuth, isLoading } = useAuth();
  const connecte = !isLoading && isAuth;

  // Sur la racine, un membre connecte va droit a son tableau de bord : c'est
  // son raccourci quotidien, il n'a pas a cliquer deux fois. La presentation
  // reste consultable a /accueil, session ouverte ou non — sans quoi personne
  // du departement ne pourrait plus la relire ni la montrer.
  if (!sansRedirection && connecte) return <Navigate to="/dashboard" replace />;

  return (
    <ThemeProvider theme={landingTheme}>
      <Box sx={{ bgcolor: 'background.default', color: 'text.primary' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1 }}>
                <Box component="img" src="/logo.png" alt="" sx={{ width: 32, height: 32 }} />
                <Typography variant="h6" sx={{ fontSize: '1.25rem' }}>Koursa</Typography>
              </Stack>
              {!connecte && (
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="text"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Créer un compte
                </Button>
              )}
              <Button
                component={RouterLink}
                to={connecte ? '/dashboard' : '/login'}
                variant="contained"
              >
                {connecte ? 'Mon espace' : 'Se connecter'}
              </Button>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Heros : un aplat d'outremer sur lequel la fiche se pose comme une
            feuille sur un bureau. Aucun degrade, la teinte porte seule. */}
        <Box component="header" sx={{ bgcolor: 'primary.main', color: 'common.white' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 7, md: 12 } }}>
            <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="h1"
                  sx={{ fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' }, mb: 3 }}
                >
                  Chaque séance notée, validée, comptée.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontSize: '1.125rem', color: 'rgba(255,255,255,.86)', maxWidth: 560, mb: 4 }}
                >
                  Koursa remplace les fiches de suivi papier du département. Le délégué
                  déclare la séance qui vient d&apos;avoir lieu, l&apos;enseignant la
                  valide, et les heures effectuées s&apos;additionnent d&apos;elles-mêmes
                  jusqu&apos;au bilan du semestre.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
                  <Button
                    component={RouterLink}
                    to={connecte ? '/dashboard' : '/login'}
                    variant="contained"
                    sx={{
                      bgcolor: 'common.white',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'rgba(255,255,255,.9)' },
                    }}
                  >
                    {connecte ? 'Accéder à mon espace' : 'Se connecter'}
                  </Button>
                  {!connecte && (
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="outlined"
                      sx={{
                        color: 'common.white',
                        borderColor: 'rgba(255,255,255,.5)',
                        '&:hover': { borderColor: 'common.white', bgcolor: 'rgba(255,255,255,.08)' },
                      }}
                    >
                      Créer un compte
                    </Button>
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.82)', maxWidth: 520 }}>
                  L&apos;accès est réservé aux membres du département. Les enseignants
                  s&apos;inscrivent avec l&apos;adresse que le département a déclarée ;
                  les délégués indiquent la classe qu&apos;ils représentent, et le chef
                  de département approuve.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FicheSuivi />
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: RESPIRATION }}>
          <Container maxWidth="lg">
            <TitreSection
              titre="Le circuit d'une fiche"
              chapeau={"Trois gestes, dans cet ordre. Rien n'est compté tant que "
                + "l'enseignant n'a pas confirmé que la séance a bien eu lieu."}
            />
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {ETAPES.map((etape, rang) => (
                <Grid key={etape.titre} size={{ xs: 12, md: 4 }}>
                  <Stack spacing={2} sx={{ height: '100%' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'common.white',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {rang + 1}
                    </Box>
                    <Typography variant="h3" sx={{ fontSize: '1.25rem' }}>
                      {etape.titre}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {etape.texte}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: RESPIRATION, bgcolor: 'craie.main' }}>
          <Container maxWidth="lg">
            <TitreSection
              titre="À chaque rôle, sa vue"
              chapeau={'Chacun ne voit que ce qui le concerne. Un même compte peut '
                + 'cumuler plusieurs rôles — un chef de département reste un enseignant.'}
            />
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {ROLES.map((role) => (
                <Grid key={role.nom} size={{ xs: 12, sm: 6 }}>
                  <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ width: 32, height: 3, bgcolor: role.couleur, mb: 2 }} />
                      <Typography variant="h3" sx={{ fontSize: '1.1875rem', mb: 1 }}>
                        {role.nom}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {role.texte}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: RESPIRATION }}>
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.875rem', md: '2.5rem' }, mb: 1.5 }}>
                  Le bilan, sans le recompter
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  Les heures s&apos;additionnent au fil des validations. Le chef de
                  département les consulte par filière, par niveau et par semestre, et
                  les emporte au format Excel.
                </Typography>
                <Stack divider={<Divider />}>
                  {['Bilan global des séances validées',
                    "Heures par unité d'enseignement",
                    'Heures par enseignant',
                    'Heures par mois'].map((ligne) => (
                      <Typography
                        key={ligne}
                        variant="body2"
                        sx={{ py: 1.25, fontWeight: 500, color: 'text.primary' }}
                      >
                        {ligne}
                      </Typography>
                  ))}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.125rem' }}>
                      Heures validées
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Licence 3 Informatique, semestre 1
                    </Typography>
                    <Table size="small" sx={{ '& td, & th': { fontVariantNumeric: 'tabular-nums' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'text.secondary' }}>Unité</TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>Séances</TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>Heures</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {RELEVE.map(([code, seances, heures]) => (
                          <TableRow key={code}>
                            <TableCell>{code}</TableCell>
                            <TableCell align="right">{seances}</TableCell>
                            <TableCell align="right">{heures}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.875rem' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.875rem' }}>
                            40
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.875rem' }}>
                            81 h 30
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box component="section" sx={{ py: RESPIRATION, bgcolor: 'craie.main' }}>
          <Container maxWidth="lg">
            <TitreSection
              titre="Sur ordinateur et sur Android"
              chapeau={"Le même compte, les mêmes fiches, d'un appareil à l'autre."}
            />
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {[{
                icone: <ComputerRounded />,
                titre: 'Application web',
                texte: 'Accessible depuis un navigateur, sur ordinateur comme sur '
                  + 'téléphone. Connexion par mot de passe ou par compte Google.',
              }, {
                icone: <PhoneAndroidRounded />,
                titre: 'Application Android',
                texte: "Prévient par notification dès qu'une fiche est soumise, "
                  + 'validée ou refusée — utile quand on quitte la salle sans ouvrir '
                  + 'son ordinateur.',
              }].map((app) => (
                <Grid key={app.titre} size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ color: 'primary.main', mt: 0.25 }}>{app.icone}</Box>
                    <Box>
                      <Typography variant="h3" sx={{ fontSize: '1.1875rem', mb: 1 }}>
                        {app.titre}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 420 }}>
                        {app.texte}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box component="footer" sx={{ bgcolor: 'text.primary', color: 'rgba(255,255,255,.82)' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: 'common.white', fontSize: '1.25rem', mb: 0.5 }}>
                  Koursa
                </Typography>
                <Typography variant="body2">
                  Département d&apos;Informatique, Faculté des Sciences
                </Typography>
                <Typography variant="body2">Université de Yaoundé I</Typography>
              </Box>
              <Typography variant="body2">
                {connecte ? 'Votre session est ouverte. ' : 'Vous avez déjà un compte ? '}
                <Link
                  component={RouterLink}
                  to={connecte ? '/dashboard' : '/login'}
                  sx={{ color: 'common.white' }}
                >
                  {connecte ? 'Revenir à mon espace' : 'Se connecter'}
                </Link>
              </Typography>
            </Stack>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
