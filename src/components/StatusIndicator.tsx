import { Loader2 } from "lucide-react";

interface StatusIndicatorProps {
  status: string;
}

export const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  if (status === "idle") return null;

  const statusMessages: Record<string, string> = {
    uploading: "Uploading and indexing files...",
    searching: "Searching through documents...",
    processing: "Processing with AI...",
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-primary animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm font-medium">{statusMessages[status] || status}</span>
    </div>
  );
};
