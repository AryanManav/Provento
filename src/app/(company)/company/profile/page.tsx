import { requireRole } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Globe, MapPin, Users } from "lucide-react";

export default async function CompanyProfilePage() {
  const user = await requireRole(["company", "admin"]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Company & Startup Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide company information visible to prospective candidates when applying to your evaluation projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Information</CardTitle>
          <CardDescription>Legal or operating brand name, industry, and location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase">Startup / Company Name</label>
            <Input placeholder="e.g. HyperLogistics Tech" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Website
              </label>
              <Input placeholder="https://yourstartup.com" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <Input placeholder="e.g. Bengaluru / Remote (India)" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Industry</label>
              <Input placeholder="e.g. B2B SaaS / FinTech" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Company Size
              </label>
              <Input placeholder="e.g. 10–50 employees" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase">Company Description</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What does your company build and what is your engineering culture?"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-indigo-600 hover:bg-indigo-700">Save Company Profile</Button>
      </div>
    </div>
  );
}
