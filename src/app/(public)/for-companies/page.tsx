import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ForCompaniesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          De-risk Junior Hiring with Evidence Before You Hire
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Hiring early-career engineers is one of the highest-variance decisions a startup makes. Standardize your evaluation with a realistic 5–10 hour paid trial project.
        </p>
        <div>
          <Link href="/signup?role=company">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              Post an Evaluation Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observe Real Craft</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            See actual git commits, schema design, error handling, and documentation before extending a full-time offer.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Save Engineering Hours</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Cut down 4 rounds of panel interviews to a single objective asynchronous project review.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standardized Rubric</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Evaluate based on observable evidence: What was required? What was delivered? What was missing?
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
