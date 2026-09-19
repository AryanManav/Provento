/**
 * The status language used everywhere. Each tone has one meaning:
 *
 *   neutral   — draft, closed, withdrawn: nothing is happening
 *   info      — sent, informational
 *   active    — in progress, selected: work is under way
 *   warning   — waiting on someone else: pending, under review
 *   attention — the viewer must act: revision requested, needs action
 *   success   — accepted, completed, paid
 *   danger    — rejected, not accepted
 */
export type StatusTone =
  "neutral" | "info" | "active" | "warning" | "attention" | "success" | "danger";
