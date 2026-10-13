import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// Unboxed clean editorial form column — seamless on white canvas.
export function AuthCard({ title, description, eyebrow, footer, className, children }: Props) {
  return (
    <section className={cn("w-full", className)}>
      {eyebrow && <div className="mb-6">{eyebrow}</div>}
      <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] leading-tight">
        {title}
      </h1>
      {description && (
        <p className="mt-2 font-body text-sm text-gray-500 leading-normal">
          {description}
        </p>
      )}
      <div className="mt-6">{children}</div>
      {footer && (
        <div className="mt-6 pt-5 border-t border-gray-100 font-body text-xs sm:text-sm text-gray-500 text-center">
          {footer}
        </div>
      )}
    </section>
  );
}
