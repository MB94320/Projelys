export type RiskLevel =
  | "Négligeable"
  | "Significatif"
  | "Critique"
  | "Inacceptable";

export type RiskNature = "Risque" | "Opportunité";

export type RiskStatus =
  | "Ouvert"
  | "En cours"
  | "Mitigé"
  | "Clos"
  | "Accepté";

export interface Risk {
  id: number;
  projectId: number;

  ref: string | null;
  title: string;
  nature: RiskNature;
  clientName: string | null;
  category: string | null;

  createdAt: string;
  statusDate: string | null;
  status: RiskStatus;

  initialEvalDate: string | null;
  initialImpact: number | null;
  initialProbability: number | null;
  initialScore: number | null;
  initialLevel: RiskLevel | null;
  initialPotentialImpact: number | null;
  initialValuatedImpact: number | null;
  initialStrategy: string | null;

  updateEvalDate: string | null;
  updateImpact: number | null;
  updateProbability: number | null;
  updateScore: number | null;
  updateLevel: RiskLevel | null;
  updatePotentialImpact: number | null;
  updateValuatedImpact: number | null;
  updateStrategy: string | null;

  cause: string | null;
  comments: string | null;
}

// Payload pour créer un risque depuis le front
export interface CreateRiskPayload {
  ref?: string | null;
  title: string;
  nature?: RiskNature;
  clientName?: string | null;
  category?: string | null;
  status?: RiskStatus;

  initialEvalDate?: string;
  initialImpact?: number | null;
  initialProbability?: number | null;
  initialPotentialImpact?: number | null;
  initialValuatedImpact?: number | null;
  initialStrategy?: string | null;

  // pas obligatoire à la création
  updateEvalDate?: string | null;
  updateImpact?: number | null;
  updateProbability?: number | null;
  updatePotentialImpact?: number | null;
  updateValuatedImpact?: number | null;
  updateStrategy?: string | null;

  cause?: string | null;
  comments?: string | null;
}

// Payload pour mise à jour
export interface UpdateRiskPayload extends Partial<CreateRiskPayload> {
  id: number;
}
