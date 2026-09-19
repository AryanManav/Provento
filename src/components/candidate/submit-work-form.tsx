"use client";

import { useActionState, useRef, useState } from "react";
import { FileUp, Loader2, Paperclip, X } from "lucide-react";
import { submitProjectWorkAction } from "@/lib/actions/evaluation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { StatusBanner } from "@/components/common/status-banner";
import { isAllowedAttachment } from "@/lib/validations/evaluation";
import { SUBMISSION_ATTACHMENTS, SUBMISSION_FILES_BUCKET } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import type { ActionResponse } from "@/lib/types/actions";
import type { SubmissionAttachmentInput } from "@/lib/validations/evaluation";

function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(-120);
}

export function SubmitWorkForm({
  projectId,
  userId,
  isResubmission,
}: {
  projectId: string;
  userId: string;
  isResubmission: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SubmissionAttachmentInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) => {
      const result = await submitProjectWorkAction(prev, formData);
      if (result.success) setFiles([]);
      return result;
    },
    null
  );

  // Files go straight from the browser to private storage, which keeps them off
  // the 1 MB server-action body limit. Storage policy confines them to this
  // candidate's own folder for this project.
  const addFiles = async (selected: FileList) => {
    setUploadError(null);
    const incoming = Array.from(selected);

    if (files.length + incoming.length > SUBMISSION_ATTACHMENTS.maxFiles) {
      setUploadError(`Attach at most ${SUBMISSION_ATTACHMENTS.maxFiles} files.`);
      return;
    }
    const rejected = incoming.find((file) => !isAllowedAttachment(file.name));
    if (rejected) {
      setUploadError(
        `${rejected.name} can't be attached. Allowed: ${SUBMISSION_ATTACHMENTS.extensions.join(", ")}.`
      );
      return;
    }
    const tooLarge = incoming.find((file) => file.size > SUBMISSION_ATTACHMENTS.maxBytes);
    if (tooLarge) {
      setUploadError(
        `${tooLarge.name} is over ${formatBytes(SUBMISSION_ATTACHMENTS.maxBytes)}.`
      );
      return;
    }

    setUploading(true);
    const storage = createClient().storage.from(SUBMISSION_FILES_BUCKET);
    const uploaded: SubmissionAttachmentInput[] = [];

    for (const file of incoming) {
      const path = `${projectId}/${userId}/${Date.now()}-${safeFileName(file.name)}`;
      const { error } = await storage.upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (error) {
        setUploadError(
          /bucket not found/i.test(error.message)
            ? "File uploads aren't set up yet. Apply the latest migration first."
            : `${file.name} couldn't be uploaded. Please try again.`
        );
        break;
      }
      uploaded.push({ path, name: file.name, size: file.size, type: file.type || null });
    }

    setFiles((current) => [...current, ...uploaded]);
    setUploading(false);
  };

  return (
    <form action={formAction} className="space-y-fib6">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="attachments" value={JSON.stringify(files)} />

      {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}
      {state?.success && (
        <StatusBanner tone="success">
          Submitted. The company can now review your work.
        </StatusBanner>
      )}

      <FormField
        label="Repository URL"
        hint="Commit history is part of the evaluation — incremental commits show how you work, not just the result."
      >
        {(id) => (
          <Input
            id={id}
            name="repositoryUrl"
            type="url"
            placeholder="https://github.com/you/project"
            required
          />
        )}
      </FormField>

      <FormField label="Deployment URL (optional)">
        {(id) => (
          <Input
            id={id}
            name="deploymentUrl"
            type="url"
            placeholder="https://your-project.vercel.app"
          />
        )}
      </FormField>

      <FormField label="What you built and why">
        {(id) => (
          <Textarea
            id={id}
            name="submissionNotes"
            rows={5}
            required
            placeholder="Summarise your approach, any trade-offs you made, and anything you would do differently with more time."
          />
        )}
      </FormField>

      <div className="space-y-fib4">
        <div className="flex flex-wrap items-center justify-between gap-fib4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Files (optional)
            </p>
            <p className="text-xs text-ink-400">
              Notebooks, reports, designs or a zip — up to{" "}
              {SUBMISSION_ATTACHMENTS.maxFiles} files,{" "}
              {formatBytes(SUBMISSION_ATTACHMENTS.maxBytes)} each.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={SUBMISSION_ATTACHMENTS.extensions.map((ext) => `.${ext}`).join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const selected = event.target.files;
              if (selected?.length) void addFiles(selected);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-fib3"
            disabled={uploading || files.length >= SUBMISSION_ATTACHMENTS.maxFiles}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            Attach files
          </Button>
        </div>

        {uploadError && <StatusBanner tone="error">{uploadError}</StatusBanner>}

        {files.length > 0 && (
          <ul className="space-y-fib3">
            {files.map((file) => (
              <li
                key={file.path}
                className="flex items-center gap-fib4 rounded-lg border border-line px-fib5 py-fib4 text-sm"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-ink-400" />
                <span className="min-w-0 flex-1 truncate text-ink-800">{file.name}</span>
                <span className="shrink-0 text-xs text-ink-400">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setFiles((current) =>
                      current.filter((item) => item.path !== file.path)
                    )
                  }
                  className="rounded-md p-fib2 text-ink-400 hover:bg-ink-100 hover:text-rose-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || uploading}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isResubmission ? (
            "Submit revision"
          ) : (
            "Submit work"
          )}
        </Button>
      </div>
    </form>
  );
}
