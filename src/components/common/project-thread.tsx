"use client";

import { useActionState, useRef } from "react";
import { Loader2, MessagesSquare, Send } from "lucide-react";
import { postProjectMessageAction } from "@/lib/actions/evaluation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/common/section-card";
import { StatusBanner } from "@/components/common/status-banner";
import { cn } from "@/lib/utils";
import type { ProjectMessageView } from "@/lib/types/domain";
import type { ActionResponse } from "@/lib/types/actions";
import { RoleBadge } from "@/components/profile/role-badge";

function timestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Clarifications between the selected candidate and the company. Messages can't
 * be edited or deleted, and the database stamps their time — response times
 * here become part of the evaluation evidence.
 */
export function ProjectThread({
  projectId,
  candidateId,
  messages,
  viewer,
  canPost = true,
}: {
  projectId: string;
  /** Whose thread, when a company is viewing — each selected candidate has one. */
  candidateId?: string;
  messages: ProjectMessageView[];
  viewer: "candidate" | "company";
  canPost?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) => {
      const result = await postProjectMessageAction(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    null
  );

  const otherParty = viewer === "candidate" ? "The company" : "The candidate";

  return (
    <SectionCard
      id="clarifications"
      title="Clarifications"
      icon={MessagesSquare}
      count={messages.length}
    >
      <div className="space-y-fib6">
        {messages.length === 0 ? (
          <p className="text-sm text-ink-400">
            {viewer === "candidate"
              ? "Unsure about a requirement? Ask here. Asking early is a good sign, not a bad one."
              : "Questions from the candidate appear here. How quickly each side answers is recorded."}
          </p>
        ) : (
          <ol className="space-y-fib5">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn("flex", message.mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-fib5 py-fib4",
                    message.mine ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-800"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.body}
                  </p>
                  <p
                    className={cn(
                      "mt-fib2 text-xs",
                      message.mine ? "text-brand-100" : "text-ink-400"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {message.mine ? "You" : otherParty}
                      <RoleBadge
                        size="sm"
                        role={
                          (viewer === "candidate") === message.mine
                            ? "candidate"
                            : "company"
                        }
                      />
                      · {timestamp(message.createdAt)}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        {canPost && (
          <form ref={formRef} action={formAction} className="space-y-fib4">
            <input type="hidden" name="projectId" value={projectId} />
            {candidateId && (
              <input type="hidden" name="candidateId" value={candidateId} />
            )}
            {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}
            <Textarea
              name="body"
              rows={3}
              maxLength={2000}
              required
              aria-label="Your message"
              placeholder={
                viewer === "candidate"
                  ? "Ask about a requirement, an edge case, or the expected output…"
                  : "Answer a question or clarify the brief…"
              }
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isPending} className="gap-fib3">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </SectionCard>
  );
}
