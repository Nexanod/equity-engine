"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

type BreakdownItem = {
  memberId: string;
  name: string;
  featureScore: number;
  bugScore: number;
  meetingScore: number;
  meetingScoreRaw: number;
  decisionScore: number;
  total: number;
  equityPercent: number;
};

export function EquityDashboard({
  breakdown,
  totalScore,
}: {
  breakdown: BreakdownItem[];
  totalScore: number;
}) {
  const pieData = breakdown.map((b, i) => ({
    name: b.name,
    value: b.equityPercent,
    fill: COLORS[i % COLORS.length],
  }));

  const barData = breakdown.map((b) => ({
    name: b.name,
    Features: Math.round(b.featureScore * 100) / 100,
    Bugs: Math.round(b.bugScore * 100) / 100,
    Meetings: Math.round(b.meetingScore * 100) / 100,
    Decisions: Math.round(b.decisionScore * 100) / 100,
    total: Math.round(b.total * 100) / 100,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Equity split
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name} ${value}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Equity"]}
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Total score across all members: {Math.round(totalScore * 100) / 100}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Contribution breakdown (scores by type)
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis type="number" tick={{ fill: "#a1a1aa" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: "#a1a1aa" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar dataKey="Features" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Bugs" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Meetings" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Decisions" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="px-4 py-3 font-medium text-zinc-300">Member</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Equity %</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Total score</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Features</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Bugs</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Meetings</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Decisions</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.memberId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                  <td className="px-4 py-3 text-emerald-400">{b.equityPercent}%</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {Math.round(b.total * 100) / 100}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {Math.round(b.featureScore * 100) / 100}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {Math.round(b.bugScore * 100) / 100}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {Math.round(b.meetingScore * 100) / 100}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {Math.round(b.decisionScore * 100) / 100}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
