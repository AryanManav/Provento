import { Download, Paperclip } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { AttachmentView } from "@/lib/types/domain";

/** Download links are short-lived signed URLs; refresh the page if one expires. */
export function AttachmentList({ attachments }: { attachments: AttachmentView[] }) {
  if (attachments.length === 0) return null;

  return (
    <ul className="space-y-fib3">
      {attachments.map((file) => (
        <li
          key={file.id}
          className="flex items-center gap-fib4 rounded-lg border border-line px-fib5 py-fib4 text-sm"
        >
          <Paperclip className="h-4 w-4 shrink-0 text-ink-400" />
          <span className="min-w-0 flex-1 truncate text-ink-800">{file.fileName}</span>
          <span className="shrink-0 text-xs text-ink-400">
            {formatBytes(file.sizeBytes)}
          </span>
          {file.url ? (
            <a
              href={file.url}
              className="inline-flex shrink-0 items-center gap-fib2 font-semibold text-brand-700 hover:underline"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          ) : (
            <span className="shrink-0 text-xs text-ink-400">Unavailable</span>
          )}
        </li>
      ))}
    </ul>
  );
}
