import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
            <div className="mb-2 h-8 w-48 animate-pulse rounded bg-zinc-700" />
            <div className="mb-6 h-4 w-64 animate-pulse rounded bg-zinc-800" />
            <div className="space-y-4">
              <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-11 animate-pulse rounded-lg bg-zinc-700" />
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
