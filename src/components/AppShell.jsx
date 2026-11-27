import { Activity, History, LogIn, LogOut, Plus } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/", label: "Record", icon: Plus },
  { to: "/device", label: "Device", icon: Activity },
  { to: "/_authed/history", label: "History", icon: History },
];

export default function AppShell({ children, activePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigateToLogin = () => navigate({ to: "/login" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              DataSync
              <span className="text-primary">Pulse</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => logout()}
                aria-label="Sign out"
                className="flex h-10 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm text-muted-foreground transition-colors active:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateToLogin()}
                className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.97]"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6">{children}</main>

        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          <div className="mx-auto grid max-w-md grid-cols-3 px-2">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = activePath === to;
              return (
                <Link key={to} to={to} className="group flex flex-col items-center gap-1 py-2">
                  <span
                    className={cn(
                      "flex h-8 w-16 items-center justify-center rounded-full transition-colors",
                      active ? "bg-primary/20" : "group-active:bg-secondary",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                  </span>
                  <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
}
