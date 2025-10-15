// Interfaces pour les APIs de débiteurs
export interface DebiteurApi {
  id: number;
  typeDebiteur?: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  codeCreance?: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  fax?: string;
  adresse: string;
  adresseElue?: string;
  ville?: string;
  codePostal?: string;
  agentCreateur?: string;
}

export interface DebiteurRequest {
  typeDebiteur?: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  codeCreance?: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  fax?: string;
  adresse: string;
  adresseElue?: string;
  ville?: string;
  codePostal?: string;
}

// Interfaces pour les réponses API
export interface DebiteurResponse {
  data: DebiteurApi;
  message: string;
  success: boolean;
}

export interface DebiteursResponse {
  data: DebiteurApi[];
  message: string;
  success: boolean;
  total: number;
}
