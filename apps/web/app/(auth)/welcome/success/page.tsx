"use client";

import Link from "next/link";

const CONFETTI_COLORS = ["#465fff", "#f97316", "#10b981", "#f59e0b", "#ef4444"];

export default function WelcomeSuccessPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-20 dark:bg-gray-900">
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 60 }).map((_, index) => {
          const left = `${(index * 7) % 100}%`;
          const delay = `${(index % 10) * 0.12}s`;
          const duration = `${4 + (index % 6) * 0.4}s`;
          const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
          return (
            <span
              key={index}
              className="confetti-piece absolute top-[-10%] h-2 w-2 rounded-sm"
              style={{
                left,
                animationDelay: delay,
                animationDuration: duration,
                backgroundColor: color,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
          Setup Complete
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Congratulations, you are ready to go
        </h1>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Your trial is active, your billing setup is complete, and your workspace is ready.
        </p>
        <div className="mt-8">
          <Link
            href="/app/overview"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Go to dashboard
          </Link>
        </div>
      </div>

      <style jsx>{`
        .confetti-piece {
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 110vh, 0) rotate(720deg);
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}

