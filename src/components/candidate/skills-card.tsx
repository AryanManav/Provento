"use client";

import { useState, useActionState } from "react";
import { addCandidateSkillAction, deleteCandidateSkillAction } from "@/app/(candidate)/candidate/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, X, Loader2, Award, Cpu } from "lucide-react";

interface SkillItem {
  id: string;
  skill_name: string;
  skill_level: string;
  years_experience: number;
}

interface SkillsCardProps {
  skills: SkillItem[];
}

export function SkillsCard({ skills }: SkillsCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const res = await addCandidateSkillAction(prev, formData);
    if (res.success) {
      setIsAdding(false);
    }
    return res;
  }, null);

  const handleDelete = async (skillId: string) => {
    setDeletingId(skillId);
    await deleteCandidateSkillAction(skillId);
    setDeletingId(null);
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level.toLowerCase()) {
      case "advanced":
        return "success";
      case "intermediate":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-[#0a66c2]" />
          <h2 className="text-lg font-bold text-[#191919]">Skills & Technical Stack</h2>
          <span className="text-xs text-slate-500 font-normal">({skills.length})</span>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5 text-xs h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Skill</span>
        </Button>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No skills added yet</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Add core languages, frameworks, or databases you know (e.g. Node.js, React, PostgreSQL).
          </p>
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            className="mt-3 rounded-full text-xs"
          >
            Add First Skill
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 group hover:border-[#0a66c2] transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-900">{skill.skill_name}</span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="capitalize">{skill.skill_level}</span>
                  {skill.years_experience > 0 && (
                    <span>• {skill.years_experience} yr{skill.years_experience > 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(skill.id)}
                disabled={deletingId === skill.id}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                title="Remove skill"
              >
                {deletingId === skill.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Skill Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Technical Skill</h3>
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
                  Skill Name
                </label>
                <Input
                  name="skillName"
                  placeholder="e.g. Node.js, PostgreSQL, React, Docker"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Proficiency Level
                </label>
                <select
                  name="skillLevel"
                  defaultValue="intermediate"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
                >
                  <option value="beginner">Beginner (Familiar / Learning)</option>
                  <option value="intermediate">Intermediate (Comfortable building)</option>
                  <option value="advanced">Advanced (Deep experience)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Years of Experience
                </label>
                <Input
                  name="yearsExperience"
                  type="number"
                  step="0.5"
                  defaultValue="1"
                  min="0"
                  max="20"
                />
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
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Skill"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
