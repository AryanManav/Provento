import { redirect } from "next/navigation";

/** Folded into the profile page; kept so existing links still resolve. */
export default function CandidateSkillsPage() {
  redirect("/candidate/profile#skills");
}
