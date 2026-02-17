/**
 * Dynamic Equity Engine - Score & share calculation
 * Total Score = Σ (Contribution × Weight × Impact)
 * User Share % = User Score / Total Score of All Members
 */

import {
  FEATURE_IMPACT_COEFF,
  FEATURE_DIFFICULTY_COEFF,
  FEATURE_BUSINESS_VALUE_COEFF,
  BUG_SCORE_MULTIPLIER,
  DECISION_SCORE_MULTIPLIER,
  MEETING_SCORE_CAP_PERCENT,
} from "./constants";

export type ScoreBreakdown = {
  featureScore: number;
  bugScore: number;
  meetingScore: number;
  meetingScoreRaw: number; // before cap
  decisionScore: number;
  total: number;
};

export type MemberScores = Record<string, ScoreBreakdown>;

/**
 * Feature base score (before contribution split):
 * (impactWeight * 0.4) + (difficultyWeight * 0.3) + (businessValueWeight * 0.3)
 */
export function featureScoreBase(
  impactWeight: number,
  difficultyWeight: number,
  businessValueWeight: number
): number {
  return (
    impactWeight * FEATURE_IMPACT_COEFF +
    difficultyWeight * FEATURE_DIFFICULTY_COEFF +
    businessValueWeight * FEATURE_BUSINESS_VALUE_COEFF
  );
}

/**
 * Bug score: severity × impactWeight × 2
 */
export function bugScore(severity: number, impactWeight: number): number {
  return severity * impactWeight * BUG_SCORE_MULTIPLIER;
}

/**
 * Meeting score: importanceWeight × contributionLevel
 */
export function meetingScore(
  importanceWeight: number,
  contributionLevel: number
): number {
  return importanceWeight * contributionLevel;
}

/**
 * Decision score: importanceWeight × influenceLevel × 2
 */
export function decisionScore(
  importanceWeight: number,
  influenceLevel: number
): number {
  return importanceWeight * influenceLevel * DECISION_SCORE_MULTIPLIER;
}

/**
 * Apply meeting cap: no member can have more than MEETING_SCORE_CAP_PERCENT of their
 * total score from meetings. We scale down meeting score if it exceeds the cap.
 */
function applyMeetingCap(breakdown: ScoreBreakdown): ScoreBreakdown {
  const coreScore =
    breakdown.featureScore + breakdown.bugScore + breakdown.decisionScore;
  const meetingRaw = breakdown.meetingScoreRaw;
  const totalWithoutCap = coreScore + meetingRaw;

  if (totalWithoutCap === 0) return { ...breakdown, meetingScore: 0, total: 0 };

  const maxMeetingAllowed =
    (totalWithoutCap * MEETING_SCORE_CAP_PERCENT) / 100;
  const meetingCapped = Math.min(meetingRaw, maxMeetingAllowed);
  const total = coreScore + meetingCapped;

  return {
    ...breakdown,
    meetingScore: meetingCapped,
    total,
  };
}

/**
 * Build full score breakdown for one member from raw components.
 * Applies meeting cap and risk multiplier.
 */
export function buildMemberBreakdown(
  raw: Omit<ScoreBreakdown, "total"> & { meetingScoreRaw: number },
  riskMultiplier: number = 1
): ScoreBreakdown {
  const capped = applyMeetingCap({
    ...raw,
    meetingScore: raw.meetingScoreRaw,
    total: 0,
  });
  return {
    ...capped,
    featureScore: capped.featureScore * riskMultiplier,
    bugScore: capped.bugScore * riskMultiplier,
    meetingScore: capped.meetingScore * riskMultiplier,
    meetingScoreRaw: capped.meetingScoreRaw * riskMultiplier,
    decisionScore: capped.decisionScore * riskMultiplier,
    total: capped.total * riskMultiplier,
  };
}

/**
 * Equity % = (MemberTotalScore / AllMembersTotalScore) × 100
 * Returns a map of memberId -> equity percent (0-100).
 */
export function equityPercentFromScores(
  memberTotals: Record<string, number>
): Record<string, number> {
  const total = Object.values(memberTotals).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return Object.fromEntries(
      Object.keys(memberTotals).map((id) => [id, 0])
    );
  }
  return Object.fromEntries(
    Object.entries(memberTotals).map(([id, score]) => [
      id,
      Math.round((score / total) * 10000) / 100,
    ])
  );
}
