export type PrioriteRecommendation = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Recommendation {
  id: number;
  dossierId: number;
  ruleCode: string;
  title: string;
  description: string;
  priority: PrioriteRecommendation;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
}


