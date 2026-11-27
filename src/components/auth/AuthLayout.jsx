import { Activity } from "lucide-react";
// Full-screen card shared by the auth pages; it sets its own color tokens so it stays readable under any theme.
export function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">DevicePulse</span>
          </div>
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Icon className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">{children}</div>
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}
