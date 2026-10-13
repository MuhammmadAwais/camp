import Image from "next/image";
import Link from "next/link";
import { AuthVisualPanel } from "@/components/auth/AuthVisualPanel";

interface Props {
  children: React.ReactNode;
}

// Split onboarding layout on the Autumn Editorial palette: step imagery on the left (desktop),
// form on the warm ivory canvas on the right. On mobile the image becomes a short banner.
export function AuthShell({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-surface text-on-surface lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden lg:block sticky top-0 h-screen p-4 pr-0">
        <AuthVisualPanel />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible" aria-label="AutoNexa home">
            <span className="relative w-9 h-5">
              <Image src="/logo-mark.webp" alt="" fill sizes="36px" className="object-contain" />
            </span>
            <span className="font-headline text-lg font-bold tracking-tight text-on-surface">AutoNexa</span>
          </Link>
          <p className="flex items-center gap-2 font-body text-xs font-medium text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-success shrink-0" aria-hidden />
            <span className="hidden sm:inline">PIPEDA Compliant • 256-Bit Encrypted</span>
            <span className="sm:hidden">Secure &amp; private</span>
          </p>
        </header>

        <div className="lg:hidden px-4 sm:px-8">
          <div className="h-36 sm:h-44">
            <AuthVisualPanel variant="compact" />
          </div>
        </div>

        <main className="flex-1 flex justify-center px-5 sm:px-8 lg:px-12 py-8 lg:py-10">{children}</main>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 pb-6 font-body text-xs text-on-surface-variant/80">
          <span>© {new Date().getFullYear()} AutoNexa</span>
          <Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-primary transition-colors">Terms</Link>
          <a href="mailto:support@autonexa.ca" className="hover:text-primary transition-colors">support@autonexa.ca</a>
        </footer>
      </div>
    </div>
  );
}
