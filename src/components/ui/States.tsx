import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Shared state components. Each one is an intentional composition, not a spinner. */

export function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="stack" style={{ gap: 28 }}>
      <span className="visually-hidden">{label}</span>
      <div className="skeleton" style={{ height: 14, width: 220 }} />
      <div className="skeleton" style={{ height: 'clamp(120px, 26vw, 220px)', width: 'min(60vw, 320px)', borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 30, width: 'min(90%, 520px)' }} />
      <div className="skeleton" style={{ height: 16, width: 180 }} />
      <div className="skeleton" style={{ aspectRatio: '1 / 1', width: '100%', maxWidth: 520, borderRadius: 28 }} />
    </div>
  );
}

export function Notice({
  title,
  children,
  tone = 'neutral',
  action,
}: {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'alert';
  action?: ReactNode;
}) {
  return (
    <section className={`notice ${tone === 'alert' ? 'notice--alert' : ''}`} aria-labelledby={undefined}>
      <h2 className="component-title" style={{ color: 'var(--ink)' }}>
        {title}
      </h2>
      {children && <div style={{ color: 'var(--ink-2)', maxWidth: '58ch' }}>{children}</div>}
      {action && <div style={{ paddingTop: 6 }}>{action}</div>}
    </section>
  );
}

interface EBState {
  error: Error | null;
}

/** Catches render-time failures so one broken view cannot blank the whole app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ATMOS render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page" id="main">
        <Notice
          title="Something went wrong on this page."
          tone="alert"
          action={
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Reload ATMOS
            </button>
          }
        >
          Your saved places and settings are kept on this device. Reloading does not remove them.
        </Notice>
      </main>
    );
  }
}
