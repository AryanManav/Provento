import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
