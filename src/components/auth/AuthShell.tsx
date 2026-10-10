import type { ReactNode } from "react";
import { MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Instant messaging",
    description: "Messages are delivered in real time over Socket.IO rooms.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "JWT handshake auth, hashed passwords, and server-verified identities.",
  },
  {
    icon: Users,
    title: "Live presence",
    description: "See who's online, offline, and typing - without refreshing.",
  },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-stretch overflow-hidden bg-[#fbf7ff]">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-crimson-300/30 blur-3xl" />

      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-crimson-600 p-12 text-white lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="h-6 w-6" />
          </span>
          <span className="text-2xl font-semibold tracking-tight">VioletChat</span>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="max-w-md text-4xl font-semibold leading-tight">
            Real-time conversations, beautifully simple.
          </h1>
          <p className="max-w-sm text-white/80">
            VioletChat pairs a premium, modern interface with a secure, authenticated real-time
            messaging engine built on Socket.IO and PostgreSQL.
          </p>

          <ul className="space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          VioletChat build with <a href="https://socket.io/" className="underline">Socket.IO</a> and <a href="https://www.postgresql.org/" className="underline">PostgreSQL</a>.
        </p>

        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "140px 140px",
          }}
        />
      </section>

      <section className="relative z-10 flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-crimson-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-slate-900">VioletChat</span>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
