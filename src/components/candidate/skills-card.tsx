"use client";

import { useId, useState, useActionState } from "react";
import { Award, Cpu, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addCandidateSkillAction,
  deleteCandidateSkillAction,
  updateCandidateSkillAction,
} from "@/lib/actions/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/common/modal";
import { SectionCard } from "@/components/common/section-card";
import { StatusBanner } from "@/components/common/status-banner";
import { SKILL_LEVELS, type SkillLevel } from "@/lib/constants";
import type { CandidateSkillView } from "@/lib/types/domain";
import type { ActionResponse } from "@/lib/types/actions";

const LEVEL_HINT: Record<SkillLevel, string> = {
  beginner: "Beginner — familiar, still learning",
  intermediate: "Intermediate — comfortable building",
  advanced: "Advanced — deep experience",
};

/** One form for both adding and editing; `skill` switches it to edit mode. */
function SkillFormModal({
  skill,
  onClose,
}: {
  skill: CandidateSkillView | null;
  onClose: () => void;
}) {
  const nameId = useId();
  const levelId = useId();
  const yearsId = useId();

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) => {
      const result = skill
        ? await updateCandidateSkillAction(prev, formData)
        : await addCandidateSkillAction(prev, formData);
      if (result.success) onClose();
      return result;
    },
    null
  );

  return (
    <Modal title={skill ? "Edit skill" : "Add a skill"} onClose={onClose}>
      <form action={formAction} className="space-y-fib6">
        {skill && <input type="hidden" name="skillId" value={skill.id} />}
        {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}

        <div className="space-y-fib3">
          <Label htmlFor={nameId}>Skill</Label>
          <Input
            id={nameId}
            name="skillName"
            defaultValue={skill?.skillName}
            placeholder="Node.js, PostgreSQL, React, Docker…"
            required
          />
        </div>

        <div className="space-y-fib3">
          <Label htmlFor={levelId}>Proficiency</Label>
          <Select
            id={levelId}
            name="skillLevel"
            defaultValue={skill?.skillLevel ?? "intermediate"}
            className="normal-case"
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_HINT[level]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-fib3">
          <Label htmlFor={yearsId}>Years of experience</Label>
          <Input
            id={yearsId}
            name="yearsExperience"
            type="number"
            step="0.5"
            min="0"
            max="20"
            defaultValue={skill?.yearsExperience ?? 1}
            required
          />
        </div>

        <div className="flex justify-end gap-fib4 border-t border-line pt-fib6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : skill ? (
              "Save skill"
            ) : (
              "Add skill"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function SkillsCard({
  skills,
  readOnly = false,
}: {
  skills: CandidateSkillView[];
  readOnly?: boolean;
}) {
  // undefined: closed · null: adding · a skill: editing that skill
  const [editing, setEditing] = useState<CandidateSkillView | null | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (skillId: string) => {
    setDeletingId(skillId);
    await deleteCandidateSkillAction(skillId);
    setDeletingId(null);
  };

  return (
    <SectionCard
      id="skills"
      title="Skills"
      icon={Cpu}
      count={skills.length}
      action={
        readOnly ? undefined : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(null)}
            className="gap-fib2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )
      }
    >
      {skills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ink-50 px-fib5 py-fib6 text-center">
          <Award className="mx-auto h-7 w-7 text-ink-300" />
          <p className="mt-fib3 text-sm font-semibold text-ink-700">No skills yet</p>
          <p className="mt-fib2 text-xs text-ink-400">
            Languages, frameworks and databases you can build with.
          </p>
        </div>
      ) : (
        <ul className="-my-1 divide-y divide-line">
          {skills.map((skill) => (
            <li key={skill.id} className="group flex items-center gap-2 py-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-900">
                {skill.skillName}
              </span>
              <span className="shrink-0 text-xs capitalize text-ink-500">
                {skill.skillLevel}
                {skill.yearsExperience > 0 &&
                  ` · ${skill.yearsExperience} yr${skill.yearsExperience === 1 ? "" : "s"}`}
              </span>
              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(skill)}
                    aria-label={`Edit ${skill.skillName}`}
                    className="rounded-md p-fib3 text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(skill.id)}
                    disabled={deletingId === skill.id}
                    aria-label={`Remove ${skill.skillName}`}
                    className="rounded-md p-fib3 text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                  >
                    {deletingId === skill.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && editing !== undefined && (
        <SkillFormModal skill={editing} onClose={() => setEditing(undefined)} />
      )}
    </SectionCard>
  );
}
