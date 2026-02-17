import { PrismaClient } from "@prisma/client";
import {
  featureScoreBase,
  bugScore,
  meetingScore,
  decisionScore,
  type ScoreBreakdown,
  type MemberScores,
  buildMemberBreakdown,
  equityPercentFromScores,
} from "./equity";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Compute score breakdown for all active members from DB.
 * Only includes features with status = done (or we can include in_progress - spec said "lock when done", so we count done features).
 * For simplicity we count all features (draft, in_progress, done) so equity updates live; you can filter to status: done only if you prefer.
 */
export async function computeAllMemberScores(): Promise<{
  scores: MemberScores;
  equityPercents: Record<string, number>;
  totalScore: number;
}> {
  const members = await prisma.member.findMany({
    where: { status: "active" },
    select: { id: true, riskMultiplier: true },
  });

  const initial: ScoreBreakdown = {
    featureScore: 0,
    bugScore: 0,
    meetingScore: 0,
    meetingScoreRaw: 0,
    decisionScore: 0,
    total: 0,
  };

  const rawScores: Record<string, ScoreBreakdown & { riskMultiplier: number }> = {};
  for (const m of members) {
    rawScores[m.id] = {
      ...initial,
      riskMultiplier: Number(m.riskMultiplier),
    };
  }

  // Features: only DONE features count (weights locked). Optionally include in_progress with current weights.
  const features = await prisma.feature.findMany({
    where: { status: "done" },
    include: { contributions: true },
  });

  for (const f of features) {
    const base = featureScoreBase(
      f.impactWeight,
      f.difficultyWeight,
      f.businessValueWeight
    );
    for (const c of f.contributions) {
      const memberId = c.memberId;
      if (!rawScores[memberId]) continue;
      const add = base * (c.contributionPercent / 100);
      rawScores[memberId].featureScore += add;
    }
  }

  // Bugs
  const bugs = await prisma.bugFix.findMany();
  for (const b of bugs) {
    const s = bugScore(b.severity, b.impactWeight);
    const memberId = b.resolvedById;
    if (!rawScores[memberId]) continue;
    rawScores[memberId].bugScore += s;
    rawScores[memberId].meetingScoreRaw = rawScores[memberId].meetingScoreRaw; // no change
  }

  // Meetings
  const meetings = await prisma.meeting.findMany({
    include: { contributions: true },
  });
  for (const m of meetings) {
    for (const c of m.contributions) {
      const s = meetingScore(m.importanceWeight, c.contributionLevel);
      const memberId = c.memberId;
      if (!rawScores[memberId]) continue;
      rawScores[memberId].meetingScoreRaw += s;
    }
  }

  // Decisions
  const decisions = await prisma.decision.findMany({
    include: { contributions: true },
  });
  for (const d of decisions) {
    for (const c of d.contributions) {
      const s = decisionScore(d.importanceWeight, c.influenceLevel);
      const memberId = c.memberId;
      if (!rawScores[memberId]) continue;
      rawScores[memberId].decisionScore += s;
    }
  }

  // Apply meeting cap and risk multiplier per member
  const scores: MemberScores = {};
  for (const [memberId, raw] of Object.entries(rawScores)) {
    scores[memberId] = buildMemberBreakdown(
      {
        featureScore: raw.featureScore,
        bugScore: raw.bugScore,
        meetingScore: 0,
        meetingScoreRaw: raw.meetingScoreRaw,
        decisionScore: raw.decisionScore,
      },
      raw.riskMultiplier
    );
  }

  const memberTotals = Object.fromEntries(
    Object.entries(scores).map(([id, b]) => [id, b.total])
  );
  const totalScore = Object.values(memberTotals).reduce((a, b) => a + b, 0);
  const equityPercents = equityPercentFromScores(memberTotals);

  return { scores, equityPercents, totalScore };
}
