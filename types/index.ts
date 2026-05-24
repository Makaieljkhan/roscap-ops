export type LenderStatus = 'hungry' | 'selective' | 'quiet' | 'changing';

export interface KeyContact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface Lender {
  id: string;
  created_at: string;
  updated_at: string;
  lender_name: string;
  common_name: string | null;
  asset_class_appetite: string[];
  geography: string | null;
  deal_size_min: number | null;
  deal_size_max: number | null;
  ltv_standard: number | null;
  ltv_stretch: number | null;
  rate_range_low: number | null;
  rate_range_high: number | null;
  arrangement_fee: string | null;
  exit_fee: string | null;
  turnaround_speed: string | null;
  current_status: LenderStatus | null;
  key_contacts: KeyContact[];
  recent_deal_experience: string | null;
  suleman_notes: string | null;
  ai_score: number | null;
  ai_score_rationale: string | null;
  ai_score_override: number | null;
}

export type LenderInsert = Omit<
  Lender,
  'id' | 'created_at' | 'updated_at' | 'ai_score' | 'ai_score_rationale' | 'ai_score_override'
>;
export type LenderUpdate = Partial<LenderInsert> & {
  ai_score?: number | null;
  ai_score_rationale?: string | null;
  ai_score_override?: number | null;
};

export interface LenderMatchRequest {
  deal_size: number;
  asset_class: string;
  ltv: number;
  geography?: string;
  additional_notes?: string;
}

export interface LenderMatchResult {
  lender: Lender;
  match_score: number;
  reasoning: string;
  caveats: string[];
}

export interface LenderMatchResponse {
  matches: LenderMatchResult[];
  summary: string;
}

export const LENDER_STATUS_LABELS: Record<LenderStatus, string> = {
  hungry: 'Hungry',
  selective: 'Selective',
  quiet: 'Quiet',
  changing: 'Changing',
};

export const LENDER_STATUS_COLORS: Record<LenderStatus, string> = {
  hungry: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  selective: 'bg-amber-50 text-amber-700 border-amber-200',
  quiet: 'bg-gray-50 text-gray-600 border-gray-200',
  changing: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const LENDER_STATUSES: LenderStatus[] = ['hungry', 'selective', 'quiet', 'changing'];

export const COMMON_ASSET_CLASSES = [
  'Residential',
  'Commercial',
  'Construction',
  'Development Finance',
  'Bridging',
  'SMSF',
  'Rural',
  'Industrial',
  'Retail',
  'Office',
  'Mixed Use',
  'Land',
  'Hotels & Hospitality',
  'Healthcare',
];
