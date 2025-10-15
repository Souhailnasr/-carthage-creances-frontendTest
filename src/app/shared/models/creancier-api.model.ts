// Interfaces pour les APIs de créanciers
export interface CreancierApi {
  id: number;
  typeCreancier?: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  codeCreancier?: string;
  codeCreance?: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  adresse: string;
  ville?: string;
  codePostal?: string;
  fax?: string;
  agentCreateur?: string;
}

export interface CreancierRequest {
  typeCreancier?: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  codeCreancier?: string;
  codeCreance?: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  adresse: string;
  ville?: string;
  codePostal?: string;
  fax?: string;
}

// Interfaces pour les réponses API
export interface CreancierResponse {
  data: CreancierApi;
  message: string;
  success: boolean;
}

export interface CreanciersResponse {
  data: CreancierApi[];
  message: string;
  success: boolean;
  total: number;
}
