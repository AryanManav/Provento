import { requireRole } from "@/lib/auth/guards";
import { getCompanyForUser } from "@/lib/data/company";
import { saveCompanyProfileAction } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBanner } from "@/components/common/status-banner";

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireRole(["company", "admin"]);
  const params = await searchParams;
  const company = await getCompanyForUser(user.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          This is visible to candidates evaluating your paid projects.
        </p>
      </div>

      {params.error && <StatusBanner tone="error">{params.error}</StatusBanner>}
      {params.saved && <StatusBanner tone="success">Company profile saved.</StatusBanner>}

      <form
        action={saveCompanyProfileAction}
        className="rounded-xl border bg-white p-6 space-y-4"
      >
        <Input
          name="name"
          defaultValue={company?.name || ""}
          placeholder="Company name"
          required
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            name="website"
            defaultValue={company?.website || ""}
            placeholder="https://company.com"
          />
          <Input
            name="location"
            defaultValue={company?.location || ""}
            placeholder="Location"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            name="industry"
            defaultValue={company?.industry || ""}
            placeholder="Industry"
          />
          <Input
            name="companySize"
            defaultValue={company?.companySize || ""}
            placeholder="Company size"
          />
        </div>

        <textarea
          name="description"
          defaultValue={company?.description || ""}
          rows={5}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
          placeholder="What does your company build?"
        />

        <div className="flex justify-end">
          <Button type="submit">Save company profile</Button>
        </div>
      </form>
    </div>
  );
}
