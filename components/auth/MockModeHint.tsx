import { FlaskConical } from "lucide-react";
import { IS_MOCK_API } from "@/lib/api-client";

interface Props {
  children: React.ReactNode;
}

// Development-only helper text, shown only while forms talk to the mock API routes.
export function MockModeHint({ children }: Props) {
  if (!IS_MOCK_API) return null;
  return (
    <p className="flex items-start gap-2 rounded-lg border border-dashed border-secondary/50 bg-secondary-fixed/40 px-3 py-2 font-body text-xs leading-relaxed text-on-secondary-fixed-variant">
      <FlaskConical className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
      <span>
        <strong className="font-semibold">Mock API:</strong> {children}
      </span>
    </p>
  );
}
