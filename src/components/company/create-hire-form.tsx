import { createHiringAction } from "@/lib/actions/company";
import {
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  MAX_APPLICANTS_LIMIT,
  MAX_HIRE_OPENINGS,
  PROJECT_CATEGORIES,
  WORK_ARRANGEMENTS,
} from "@/lib/constants";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Field,
  FormSection,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/company/form-parts";

/**
 * A hire-only posting: a role, free to post. No fee, deliverables, trial or
 * evaluation — only what a candidate needs to decide whether to apply.
 */
export function CreateHireForm() {
  return (
    <form
      action={createHiringAction}
      className="space-y-6 rounded-xl border border-line bg-surface p-6"
    >
      <FormSection title="The role" description="What candidates see first.">
        <Field id="title" label="Job title">
          <input
            id="title"
            name="title"
            required
            minLength={3}
            maxLength={150}
            placeholder="Frontend Developer"
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="jobType" label="Job type">
            <select
              id="jobType"
              name="jobType"
              required
              defaultValue=""
              className={selectClass}
            >
              <option value="" disabled>
                Choose
              </option>
              {Object.entries(JOB_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="experienceLevel" label="Experience level">
            <select
              id="experienceLevel"
              name="experienceLevel"
              required
              defaultValue=""
              className={selectClass}
            >
              <option value="" disabled>
                Choose
              </option>
              {Object.entries(EXPERIENCE_LEVELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="workArrangement" label="Work arrangement">
            <select
              id="workArrangement"
              name="workArrangement"
              required
              defaultValue=""
              className={selectClass}
            >
              <option value="" disabled>
                Choose
              </option>
              {Object.entries(WORK_ARRANGEMENTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="jobLocation" label="Location" optional>
            <input
              id="jobLocation"
              name="jobLocation"
              maxLength={120}
              placeholder="Bengaluru"
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          id="category"
          label="Area"
          hint="Where the role is listed when candidates browse."
        >
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled>
              Choose an area
            </option>
            {Object.entries(PROJECT_CATEGORIES).map(([value, topic]) => (
              <option key={value} value={value}>
                {topic.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="skills"
          label="Skills"
          hint="One per line — React, TypeScript, Node.js…"
        >
          <textarea id="skills" name="skills" rows={3} className={textareaClass} />
        </Field>
      </FormSection>

      <FormSection title="Description" description="Lists take one item per line.">
        <Field
          id="description"
          label="Summary"
          hint="One or two sentences, shown on the listing."
        >
          <textarea
            id="description"
            name="description"
            rows={2}
            required
            minLength={20}
            className={textareaClass}
          />
        </Field>
        <Field id="aboutRole" label="About the role">
          <textarea
            id="aboutRole"
            name="aboutRole"
            rows={5}
            required
            minLength={30}
            className={textareaClass}
          />
        </Field>
        <Field id="responsibilities" label="Responsibilities">
          <textarea
            id="responsibilities"
            name="responsibilities"
            rows={4}
            required
            className={textareaClass}
          />
        </Field>
        <Field id="requirements" label="Requirements">
          <textarea
            id="requirements"
            name="requirements"
            rows={4}
            required
            className={textareaClass}
          />
        </Field>
        <Field id="niceToHave" label="Nice to have" optional>
          <textarea
            id="niceToHave"
            name="niceToHave"
            rows={3}
            className={textareaClass}
          />
        </Field>
        <Field
          id="compensation"
          label="Salary or compensation"
          optional
          hint="As you'd like it shown, e.g. “₹6–9 LPA” or “Competitive”."
        >
          <input
            id="compensation"
            name="compensation"
            maxLength={120}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Hiring capacity"
        description="Two separate numbers: how many people you'll hire, and how many applications you'll accept."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="openings"
            label="Number of openings"
            hint="You can select up to this many candidates."
          >
            <input
              id="openings"
              name="openings"
              type="number"
              min={1}
              max={MAX_HIRE_OPENINGS}
              required
              defaultValue={1}
              className={inputClass}
            />
          </Field>
          <Field
            id="maxApplicants"
            label="Maximum applications"
            hint="Applications close once this many arrive."
          >
            <input
              id="maxApplicants"
              name="maxApplicants"
              type="number"
              min={1}
              max={MAX_APPLICANTS_LIMIT}
              required
              defaultValue={100}
              className={inputClass}
            />
          </Field>
        </div>
        <Field id="applicationDeadline" label="Application deadline">
          <input
            id="applicationDeadline"
            name="applicationDeadline"
            type="datetime-local"
            required
            className={inputClass}
          />
        </Field>
      </FormSection>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <p className="text-sm text-ink-500">
          Posting a hiring opportunity is{" "}
          <span className="font-medium text-emerald-700">free</span>.
        </p>
        <SubmitButton>Post hiring opportunity</SubmitButton>
      </div>
    </form>
  );
}
