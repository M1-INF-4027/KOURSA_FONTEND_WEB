import { createContext } from 'react';

// Isole du fournisseur : un fichier qui exporte un composant ne doit
// rien exporter d'autre, sous peine de priver Vite de son
// rafraichissement a chaud.
export const ConfigContext = createContext(null);
