import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-surface text-on-surface p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border-card bg-surface-container-lowest p-8 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            404
          </p>
          <h1 className="text-2xl font-bold text-on-surface">Page not found</h1>
          <p className="text-sm text-on-surface-variant">
            The requested route does not exist on AutoNexa.
          </p>
          <div className="pt-2">
            <Link
              href="/en"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to AutoNexa
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
