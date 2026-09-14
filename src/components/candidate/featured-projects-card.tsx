"use client";

import { useState, useActionState } from "react";
import { addCandidateProjectAction, deleteCandidateProjectAction } from "@/app/(candidate)/candidate/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Github, ExternalLink, Trash2, X, Loader2, Code2, FolderGit2 } from "lucide-react";

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  repository_url: string | null;
  live_url: string | null;
}

interface FeaturedProjectsCardProps {
  projects: ProjectItem[];
}

export function FeaturedProjectsCard({ projects }: FeaturedProjectsCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const res = await addCandidateProjectAction(prev, formData);
    if (res.success) {
      setIsAdding(false);
    }
    return res;
  }, null);

  const handleDelete = async (projectId: string) => {
    setDeletingId(projectId);
    await deleteCandidateProjectAction(projectId);
    setDeletingId(null);
  };

  return (
    <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FolderGit2 className="h-5 w-5 text-[#0a66c2]" />
          <h2 className="text-lg font-bold text-[#191919]">Featured Projects & Code</h2>
          <span className="text-xs text-slate-500 font-normal">({projects.length})</span>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5 text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Project</span>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Code2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No projects showcased yet</p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
            Showcase personal or academic projects with GitHub repositories or live deployments to prove your ability.
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="mt-3 rounded-full text-xs"
          >
            Add First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {projects.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:border-[#0a66c2] hover:bg-white transition-all shadow-xs group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#191919] group-hover:text-[#0a66c2] transition-colors">
                    {item.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                    title="Delete project"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                {item.technologies && item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-200/60 text-xs">
                {item.repository_url && (
                  <a
                    href={item.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-slate-700 hover:text-[#0a66c2] font-semibold"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>Code</span>
                  </a>
                )}
                {item.live_url && (
                  <a
                    href={item.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#0a66c2] hover:underline font-semibold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Demo</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Technical Project</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              {state?.error && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Project Title
                </label>
                <Input
                  name="title"
                  placeholder="e.g. Distributed Task Queue or E-Commerce REST API"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Description & What You Built
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Explain what problem it solved, key architecture choices, and database structure..."
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Technologies Used (Comma-separated)
                </label>
                <Input
                  name="technologies"
                  placeholder="Node.js, PostgreSQL, Redis, Jest, Docker"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1">
                    <Github className="h-3.5 w-3.5" /> Repository URL
                  </label>
                  <Input
                    name="repositoryUrl"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Live Demo URL
                  </label>
                  <Input
                    name="liveUrl"
                    placeholder="https://myproject.app"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="rounded-full">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
