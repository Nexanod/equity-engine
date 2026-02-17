# Dynamic Equity Engine

Fair, transparent, hard-to-game equity split for startups. Measures **Contribution × Impact × Risk** (risk multiplier same for everyone until you add full-time/part-time or salary cut).

## Stack

- **Next.js** (App Router)
- **PostgreSQL** + **Prisma**
- **NextAuth** (Credentials + JWT)
- **Role-based access**: Founder / Admin / Viewer

## Formulas

- **Feature score (base)**  
  `(impactWeight × 0.4) + (difficultyWeight × 0.3) + (businessValueWeight × 0.3)`  
  Then split by `contributionPercent` per member.

- **Bug score**  
  `severity × impactWeight × 2`

- **Meeting score**  
  `importanceWeight × contributionLevel`  
  (Capped so meetings can’t exceed **10%** of a member’s total score.)

- **Decision score**  
  `importanceWeight × influenceLevel × 2`

- **Equity %**  
  `(Member total score / Sum of all members’ scores) × 100`

## Anti-gaming

1. **Weight voting** – Feature weights can be set by **majority vote** or **average of founders’ votes**. Use **Vote** on a feature, then **Apply weights** (POST `/api/features/[id]/apply-weights`) to set weights from the average of votes.
2. **Lock when done** – When a feature is marked **Done**, its weights are locked permanently.
3. **Meeting cap** – Max 10% of a member’s total score can come from meetings.
4. **Quarterly freeze** – Create snapshots (e.g. 2025-Q1) to store equity versions.

## Setup

1. **Env**

   ```bash
   cp .env.example .env
   # Set DATABASE_URL (PostgreSQL) and AUTH_SECRET (e.g. openssl rand -base64 32)
   ```

2. **DB**

   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   ```

3. **Run**

   ```bash
   npm run dev
   ```

4. **Login**  
   After seed: `founder@startup.com` / `founder123`.

## UI

- **Dashboard** – Live equity %, pie chart, contribution breakdown table.
- **Features** – Add feature (weights + contributors %). Mark done to lock weights. Vote on weights then apply from average.
- **Bugs** – Add bug (severity, impact, resolved by).
- **Meetings** – Add meeting (topic, importance, participants + contribution level).
- **Decisions** – Add strategic decision (title, importance, contributors + influence level).
- **Reports** – Quarterly snapshots, Export CSV.

## API (examples)

- `GET /api/equity` – Current scores and equity %.
- `GET/POST /api/members` – List / create members (Founder/Admin).
- `GET/POST /api/features` – List / create features.
- `PATCH /api/features/[id]` – Update status (e.g. to `done` → locks weights) or contributions.
- `POST /api/features/[id]/vote` – Submit your weight vote (impact, difficulty, businessValue).
- `POST /api/features/[id]/apply-weights` – Set feature weights from average of votes (Founder/Admin).
- `GET/POST /api/bugs`, `GET/POST /api/meetings`, `GET/POST /api/decisions`, `GET/POST /api/snapshots`.

## Future: Risk multiplier

Schema already has `riskMultiplier` on `Member`. When someone invests money, works full-time, or takes a salary cut, increase their multiplier; their score (and thus equity %) scales accordingly.
