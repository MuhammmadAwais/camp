import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// Unboxed editorial form column — the split layout supplies the framing, so no card chrome here.
export function AuthCard({ title, description, eyebrow, footer, className, children }: Props) {
  return (
    <section className={cn("w-full max-w-lg", className)}>
      {eyebrow && <div className="mb-10">{eyebrow}</div>}
      <h1 className="font-headline text-3xl sm:text-[36px] font-bold tracking-tight text-on-surface leading-[1.1]">{title}</h1>
      {description && <p className="mt-3 font-body text-base text-on-surface-variant leading-relaxed">{description}</p>}
      <div className="mt-8">{children}</div>
      {footer && (
        <div className="mt-8 pt-6 border-t border-border-card font-body text-sm text-on-surface-variant text-center">{footer}</div>
      )}
    </section>
  );
}
