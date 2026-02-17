-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('FOUNDER', 'ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('draft', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "riskMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impactWeight" INTEGER NOT NULL,
    "difficultyWeight" INTEGER NOT NULL,
    "businessValueWeight" INTEGER NOT NULL,
    "status" "FeatureStatus" NOT NULL DEFAULT 'draft',
    "weightsLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_weight_votes" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "impactWeight" INTEGER NOT NULL,
    "difficultyWeight" INTEGER NOT NULL,
    "businessValueWeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_weight_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_contributions" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contributionPercent" INTEGER NOT NULL,

    CONSTRAINT "feature_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bugs" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "severity" INTEGER NOT NULL,
    "impactWeight" INTEGER NOT NULL,
    "resolvedById" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "importanceWeight" INTEGER NOT NULL,
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_contributions" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "contributionLevel" INTEGER NOT NULL,

    CONSTRAINT "meeting_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "importanceWeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_contributions" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "influenceLevel" INTEGER NOT NULL,

    CONSTRAINT "decision_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equity_snapshots" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equity_snapshot_entries" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "equityPercent" DECIMAL(5,2) NOT NULL,
    "totalScore" DECIMAL(12,2) NOT NULL,
    "featureScore" DECIMAL(12,2) NOT NULL,
    "bugScore" DECIMAL(12,2) NOT NULL,
    "meetingScore" DECIMAL(12,2) NOT NULL,
    "decisionScore" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "equity_snapshot_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "feature_weight_votes_featureId_memberId_key" ON "feature_weight_votes"("featureId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_contributions_featureId_memberId_key" ON "feature_contributions"("featureId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_contributions_meetingId_memberId_key" ON "meeting_contributions"("meetingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_contributions_decisionId_memberId_key" ON "decision_contributions"("decisionId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "equity_snapshot_entries_snapshotId_memberId_key" ON "equity_snapshot_entries"("snapshotId", "memberId");

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_weight_votes" ADD CONSTRAINT "feature_weight_votes_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_weight_votes" ADD CONSTRAINT "feature_weight_votes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_contributions" ADD CONSTRAINT "feature_contributions_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_contributions" ADD CONSTRAINT "feature_contributions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bugs" ADD CONSTRAINT "bugs_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_contributions" ADD CONSTRAINT "meeting_contributions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_contributions" ADD CONSTRAINT "meeting_contributions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_contributions" ADD CONSTRAINT "decision_contributions_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_contributions" ADD CONSTRAINT "decision_contributions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equity_snapshot_entries" ADD CONSTRAINT "equity_snapshot_entries_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "equity_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equity_snapshot_entries" ADD CONSTRAINT "equity_snapshot_entries_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
