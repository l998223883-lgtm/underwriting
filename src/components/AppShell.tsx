import { Link } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import { usePendingCount } from "@/store/cre-store";
import { CommandBar, CommandHint } from "./CommandBar";

export function AppShell({ children }: { children: ReactNode }) {
  const pendingCount = usePendingCount();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
          <Link to="/portfolio" className="flex items-baseline gap-2">
            <span className="font-serif text-[22px] leading-none tracking-tight text-ink-strong sm:text-[26px]">Sentinel</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:inline">CRE Risk</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-6">
            <CommandHint onClick={() => setCmdOpen(true)} />
            <span className="hidden h-5 w-px bg-rule sm:block" />
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted/60 lg:inline">Risk intelligence</span>
            <div className="flex items-center gap-3 sm:gap-5">
              <NavLink to="/portfolio">Portfolio</NavLink>
              <NavLink to="/inbox">
                <span className="flex items-center gap-1.5">
                  Inbox
                  {pendingCount > 0 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-risk-med/15 px-1.5 font-mono text-[10px] font-medium text-risk-med">
                      {pendingCount}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/activity">Activity</NavLink>
              <NavLink to="/sim-history">History</NavLink>
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      <footer className="mt-16 border-t border-rule">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:px-8">
          <span>Sentinel · v0.1 MVP</span>
          <span>Human-in-the-loop · Monte Carlo simulation · Cmd K to ask</span>
        </div>
      </footer>
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-ink-muted transition-colors hover:text-ink-strong [&.active]:text-ink-strong [&.active]:underline [&.active]:underline-offset-[6px]"
      activeProps={{ className: "active" }}
      activeOptions={{ exact: true }}
    >
      {children}
    </Link>
  );
}
