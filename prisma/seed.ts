import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

/** Parse a CSV line; handles commas in Summary by treating last 6 columns as fixed. */
function parseJiraRow(line: string): Record<string, string> | null {
  const parts = line.split(",").map((p) => p.trim());
  if (parts.length < 10) return null;
  const issueType = parts[0];
  const issueKey = parts[1];
  const issueId = parts[2];
  const summary = parts.length === 10 ? parts[3] : parts.slice(3, parts.length - 6).join(", ").trim();
  const assignee = parts[parts.length - 6]?.trim() ?? "";
  const assigneeId = parts[parts.length - 5] ?? "";
  const reporter = parts[parts.length - 4] ?? "";
  const reporterId = parts[parts.length - 3] ?? "";
  const priority = parts[parts.length - 2] ?? "Medium";
  const status = parts[parts.length - 1] ?? "";
  if (!assignee || !summary) return null;
  return { issueType, issueKey, issueId, summary, assignee, assigneeId, reporter, reporterId, priority, status };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

function priorityToSeverity(priority: string): number {
  const map: Record<string, number> = {
    Highest: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Lowest: 1,
  };
  return map[priority] ?? 3;
}

function statusToFeatureStatus(status: string): "draft" | "in_progress" | "done" {
  const s = status.toLowerCase();
  if (s === "completed" || s === "done") return "done";
  if (s === "in progress") return "in_progress";
  return "draft";
}

async function main() {
  // 1) Founder account (keep for login)
  const hash = await bcrypt.hash("founder123", 10);
  const founder = await prisma.member.upsert({
    where: { email: "founder@startup.com" },
    update: {},
    create: {
      name: "Founder One",
      email: "founder@startup.com",
      passwordHash: hash,
      role: "FOUNDER",
    },
  });
  console.log("Seed: founder", founder.email);

  // 2) Load Jira CSV
  const csvPath = join(process.cwd(), "data", "Jira.csv");
  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, "utf-8");
  } catch (e) {
    console.warn("Jira.csv not found at data/Jira.csv, skipping Jira seed.", e);
    console.log("Seed complete. Login: founder@startup.com / founder123");
    return;
  }

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0];
  if (!header?.toLowerCase().includes("assignee")) {
    console.warn("Jira.csv missing Assignee column, skipping Jira seed.");
    return;
  }

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseJiraRow(lines[i]!);
    if (row) rows.push(row);
  }

  const uniqueAssignees = [...new Set(rows.map((r) => r.assignee).filter(Boolean))];
  const defaultPasswordHash = await bcrypt.hash("member123", 10);

  // 3) Create members from assignees (by name)
  const memberByAssignee: Record<string, { id: string }> = {};
  for (const name of uniqueAssignees) {
    const email = `${slug(name)}@startup.com`;
    const member = await prisma.member.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash: defaultPasswordHash,
        role: "VIEWER",
      },
    });
    memberByAssignee[name] = { id: member.id };
  }
  console.log("Seed: members from Jira assignees", Object.keys(memberByAssignee).length);

  // 4) Create features (Story, Task, Epic) and bugs (Bug) and assign to assignee
  let featuresCreated = 0;
  let bugsCreated = 0;

  for (const row of rows) {
    const memberId = memberByAssignee[row.assignee]?.id;
    if (!memberId) continue;

    if (row.issueType === "Bug") {
      const severity = priorityToSeverity(row.priority);
      await prisma.bugFix.create({
        data: {
          title: row.summary.length > 200 ? row.summary.slice(0, 200) : row.summary,
          severity,
          impactWeight: Math.min(5, Math.max(1, severity)),
          resolvedById: memberId,
        },
      });
      bugsCreated++;
    } else {
      // Story, Task, Epic -> Feature
      const status = statusToFeatureStatus(row.status);
      const isDone = status === "done";
      await prisma.feature.create({
        data: {
          title: row.summary.length > 255 ? row.summary.slice(0, 255) : row.summary,
          description: row.issueKey || null,
          impactWeight: 5,
          difficultyWeight: 3,
          businessValueWeight: 5,
          status,
          // weightsLocked: isDone,
          memberId,
          completedAt: isDone ? new Date() : null,
          contributions: {
            create: [{ memberId, contributionPercent: 100 }],
          },
        },
      });
      featuresCreated++;
    }
  }

  console.log("Seed: features from Jira", featuresCreated);
  console.log("Seed: bugs from Jira", bugsCreated);
  console.log("Seed complete. Login: founder@startup.com / founder123 (or <assignee>@startup.com / member123)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
