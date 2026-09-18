import { createClient } from "@/lib/supabase/server";
import type { ProjectMessageView } from "@/lib/types/domain";
import type { ProjectMessageAuthorRole } from "@/lib/types/database.types";

interface RawMessage {
  id: string;
  author_id: string;
  author_role: ProjectMessageAuthorRole;
  body: string;
  created_at: string;
}

/** The clarification thread for a project's selected candidate, oldest first. */
export async function getProjectThread(
  projectId: string,
  candidateId: string,
  viewerUserId: string
): Promise<ProjectMessageView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_messages")
    .select("id, author_id, author_role, body, created_at")
    .eq("project_id", projectId)
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as unknown as RawMessage[]).map((row) => ({
    id: row.id,
    authorRole: row.author_role,
    body: row.body,
    createdAt: row.created_at,
    mine: row.author_id === viewerUserId,
  }));
}
