/**
 * Anti-gaming and scoring constants
 */

// Max % of total score that can come from meetings (prevents farming)
export const MEETING_SCORE_CAP_PERCENT = 10;

// Feature weight formula coefficients
export const FEATURE_IMPACT_COEFF = 0.4;
export const FEATURE_DIFFICULTY_COEFF = 0.3;
export const FEATURE_BUSINESS_VALUE_COEFF = 0.3;

// Bug score multiplier
export const BUG_SCORE_MULTIPLIER = 2;

// Decision score multiplier
export const DECISION_SCORE_MULTIPLIER = 2;

// Weight bounds (for validation)
export const IMPACT_WEIGHT_MIN = 1;
export const IMPACT_WEIGHT_MAX = 10;
export const DIFFICULTY_WEIGHT_MIN = 1;
export const DIFFICULTY_WEIGHT_MAX = 5;
export const BUSINESS_VALUE_WEIGHT_MIN = 1;
export const BUSINESS_VALUE_WEIGHT_MAX = 10;
export const SEVERITY_MIN = 1;
export const SEVERITY_MAX = 5;
export const MEETING_IMPORTANCE_MIN = 1;
export const MEETING_IMPORTANCE_MAX = 5;
export const CONTRIBUTION_LEVEL_MIN = 1;
export const CONTRIBUTION_LEVEL_MAX = 5;
export const DECISION_IMPORTANCE_MIN = 1;
export const DECISION_IMPORTANCE_MAX = 10;
export const INFLUENCE_LEVEL_MIN = 1;
export const INFLUENCE_LEVEL_MAX = 5;
