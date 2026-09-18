"use client";

import { useState, useActionState } from "react";
import {
  Code2,
  ExternalLink,
  FolderGit2,
  Github,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  addCandidateProjectAction,
  deleteCandidateProjectAction,
  updateCandidateProjectAction,
} from "@/lib/actions/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/common/modal";
import { SectionCard } from "@/components/common/section-card";
import { StatusBanner } from "@/components/common/status-banner";
import type { CandidateProjectView } from "@/lib/types/domain";
import type { ActionResponse } from "@/lib/types/actions";

/** One form for both adding and editing; `project` switches it to edit mode. */
function ProjectFormModal({
  project,
  onClose,
}: {
  project: CandidateProjectView | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) => {
      const result = project
        ? await updateCandidateProjectAction(prev, formData)
        : await addCandidateProjectAction(prev, formData);
      if (result.success) onClose();
      return result;
    },
    null
  );

  return (
    <Modal title={project ? "Edit project" : "Add a project"} onClose={onClose} size="lg">
      <form action={formAction} className="space-y-fib6">
        {project && <input type="hidden" name="projectId" value={project.id} />}
        {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}

        <FormField label="Title">
          {(id) => (
            <Input
              id={id}
              name="title"
              defaultValue={project?.title}
              placeholder="Distributed task queue, e-commerce REST API…"
              required
            />
          )}
        </FormField>

        <FormField label="What you built">
          {(id) => (
            <Textarea
              id={id}
              name="description"
              rows={3}
              defaultValue={project?.description}
              placeholder="The problem it solved, the key architecture choices, and how the data is structured."
              required
            />
          )}
        </FormField>

        <FormField label="Technologies" hint="Comma-separated.">
          {(id) => (
            <Input
              id={id}
              name="technologies"
              defaultValue={project?.technologies.join(", ")}
              placeholder="Node.js, PostgreSQL, Redis, Jest, Docker"
              required
            />
          )}
        </FormField>

        <div className="grid gap-fib5 sm:grid-cols-2">
          <FormField label="Repository" icon={Github}>
            {(id) => (
              <Input
                id={id}
                name="repositoryUrl"
                type="url"
                defaultValue={project?.repositoryUrl || ""}
                placeholder="https://github.com/…"
              />
            )}
          </FormField>
          <FormField label="Live demo" icon={ExternalLink}>
            {(id) => (
              <Input
                id={id}
                name="liveUrl"
                type="url"
                defaultValue={project?.liveUrl || ""}
                placeholder="https://myproject.app"
              />
            )}
          </FormField>
        </div>

        <div className="flex justify-end gap-fib4 border-t border-line pt-fib6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : project ? (
              "Save project"
            ) : (
              "Add project"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function FeaturedProjectsCard({
  projects,
  readOnly = false,
}: {
  projects: CandidateProjectView[];
  readOnly?: boolean;
}) {
  // undefined: closed · null: adding · a project: editing that project
  const [editing, setEditing] = useState<CandidateProjectView | null | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    await deleteCandidateProjectAction(projectId);
    setDeletingId(null);
  };

  return (
    <SectionCard
      id="projects"
      title="Featured projects"
      icon={FolderGit2}
      count={projects.length}
      action={
        readOnly ? undefined : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(null)}
            className="gap-fib2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add project
          </Button>
        )
      }
    >
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ink-50 px-fib6 py-fib7 text-center">
          <Code2 className="mx-auto h-8 w-8 text-ink-300" />
          <p className="mt-fib4 text-sm font-semibold text-ink-700">No projects yet</p>
          <p className="mx-auto mt-fib2 max-w-sm text-xs text-ink-400">
            Personal or academic work with a repository or live demo — the first thing a
            startup opens after your evaluations.
          </p>
        </div>
      ) : (
        <div className="grid gap-fib5 sm:grid-cols-2">
          {projects.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-line p-fib6 transition-colors hover:border-brand-300"
            >
              <div className="space-y-fib4">
                <div className="flex items-start justify-between gap-fib3">
                  <h3 className="font-bold text-ink-900">{item.title}</h3>
                  <div className="flex shrink-0 items-center">
                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(item)}
                          aria-label={`Edit ${item.title}`}
                          className="rounded-md p-fib3 text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          aria-label={`Delete ${item.title}`}
                          className="rounded-md p-fib3 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="line-clamp-3 text-sm leading-relaxed text-ink-500">
                  {item.description}
                </p>

                {item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-fib3">
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-ink-100 px-fib4 py-fib1 text-xs font-medium text-ink-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(item.repositoryUrl || item.liveUrl) && (
                <div className="mt-fib5 flex items-center gap-fib5 border-t border-line pt-fib5 text-sm">
                  {item.repositoryUrl && (
                    <a
                      href={item.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-fib2 font-semibold text-ink-700 hover:text-brand-600"
                    >
                      <Github className="h-4 w-4" />
                      Code
                    </a>
                  )}
                  {item.liveUrl && (
                    <a
                      href={item.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-fib2 font-semibold text-brand-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Demo
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {!readOnly && editing !== undefined && (
        <ProjectFormModal project={editing} onClose={() => setEditing(undefined)} />
      )}
    </SectionCard>
  );
}
