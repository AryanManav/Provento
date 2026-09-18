"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createApplicationAction } from "@/lib/actions/candidate";
import { Button } from "@/components/ui/button";

export function ApplicationForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(createApplicationAction, null);
  if (state?.success)
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
        Application submitted. You can follow its progress from My Applications.
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      {state?.error && (
        <p className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      <div>
        <label className="text-sm font-semibold text-slate-700">
          Why are you a strong fit?
        </label>
        <textarea
          name="coverMessage"
          required
          minLength={20}
          rows={5}
          className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm"
          placeholder="Describe your proposed approach and the experience most relevant to this evaluation."
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">
          Relevant experience <span className="font-normal text-slate-400">optional</span>
        </label>
        <textarea
          name="relevantExperience"
          rows={3}
          className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm"
          placeholder="Mention a similar project, repository, or technical challenge."
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
      </Button>
    </form>
  );
}
