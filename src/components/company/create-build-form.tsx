import { createProjectAction } from "@/lib/actions/company";
import { MAX_APPLICANTS_LIMIT, PROJECT_CATEGORIES, WORK_MODES } from "@/lib/constants";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Field,
  FormSection,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/company/form-parts";

const LISTS = [
  { name: "requirements", label: "Requirements" },
  { name: "deliverables", label: "Deliverables" },
  { name: "acceptanceCriteria", label: "Acceptance criteria" },
  { name: "evaluationCriteria", label: "Evaluation criteria" },
] as const;

/**
 * A build-only project: Trialent's paid project. One selected candidate
 * builds it against these requirements, is evaluated, and is paid the fee.
 */
export function CreateBuildForm() {
  const buildable = (
    Object.entries(WORK_MODES) as [string, (typeof WORK_MODES)[keyof typeof WORK_MODES]][]
  ).filter(([, mode]) => mode.available);
  return (
    <form
      action={createProjectAction}
      className="space-y-6 rounded-xl border border-line bg-surface p-6"
    >
      <FormSection title="The project" description="What candidates see on the listing.">
        <Field id="title" label="Project title">
          <input
            id="title"
            name="title"
            required
            minLength={5}
            maxLength={150}
            placeholder="Real-time collaborative Kanban board"
            className={inputClass}
          />
        </Field>
        <Field
          id="category"
          label="Topic"
          hint="Where it's listed when candidates browse."
        >
          <select
            id="category"
            name="category"
            required
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {Object.entries(PROJECT_CATEGORIES).map(([value, topic]) => (
              <option key={value} value={value}>
                {topic.label}
              </option>
            ))}
          </select>
        </Field>
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
        <Field id="skills" label="Tech stack" optional hint="One per line.">
          <textarea id="skills" name="skills" rows={3} className={textareaClass} />
        </Field>
        {buildable.map(([value]) => (
          <input key={value} type="hidden" name="workMode" value={value} />
        ))}
      </FormSection>

      <FormSection title="The brief" description="Lists take one item per line.">
        <Field id="problemStatement" label="Problem statement">
          <textarea
            id="problemStatement"
            name="problemStatement"
            rows={4}
            required
            minLength={30}
            className={textareaClass}
          />
        </Field>
        <Field id="context" label="Business and engineering context">
          <textarea
            id="context"
            name="context"
            rows={4}
            required
            minLength={30}
            className={textareaClass}
          />
        </Field>
        {LISTS.map(({ name, label }) => (
          <Field key={name} id={name} label={label}>
            <textarea id={name} name={name} rows={3} required className={textareaClass} />
          </Field>
        ))}
      </FormSection>

      <FormSection
        title="Payment and timeline"
        description="One candidate is selected, builds the project, and is paid this fee."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="paymentAmount" label="Project fee (INR)" hint="At least ₹1,000.">
            <input
              id="paymentAmount"
              name="paymentAmount"
              type="number"
              min={1000}
              required
              className={inputClass}
            />
          </Field>
          <Field
            id="expectedHours"
            label="Expected effort (hours)"
            hint="Between 2 and 40."
          >
            <input
              id="expectedHours"
              name="expectedHours"
              type="number"
              min={2}
              max={40}
              required
              className={inputClass}
            />
          </Field>
          <Field id="applicationDeadline" label="Application deadline">
            <input
              id="applicationDeadline"
              name="applicationDeadline"
              type="datetime-local"
              required
              className={inputClass}
            />
          </Field>
          <Field id="projectDeadline" label="Project deadline">
            <input
              id="projectDeadline"
              name="projectDeadline"
              type="datetime-local"
              required
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          id="maxApplicants"
          label="Applicant limit"
          optional
          hint="Once this many apply, the project shows as Full. Leave empty for no limit."
        >
          <input
            id="maxApplicants"
            name="maxApplicants"
            type="number"
            min={1}
            max={MAX_APPLICANTS_LIMIT}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <p className="text-sm text-ink-500">
          Paid project ·{" "}
          <span className="font-medium text-ink-800">one candidate is selected</span>
        </p>
        <SubmitButton>Publish project</SubmitButton>
      </div>
    </form>
  );
}
