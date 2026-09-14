import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Shield, Award, Terminal, Code2, Users2, Building2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Project-Based Talent Discovery for Startups
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Try talent through real work <span className="text-indigo-600">before you hire.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate the guesswork of junior technical hiring. Startups evaluate emerging engineers through standardized, paid micro-projects. Real evidence before any hiring decision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup?role=company">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-base px-8 h-12 shadow-md">
                Hire Through Paid Projects
              </Button>
            </Link>
            <Link href="/signup?role=candidate">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12 border-slate-300">
                Prove Your Skills as a Candidate
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex items-center justify-center gap-8 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> Standardized 5–10h Projects
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> 100% Paid Work for Candidates
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> Evidence-Based Evaluations
            </span>
          </div>
        </div>
      </section>

      {/* The Fundamental Shift: Traditional vs Provento */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            The Hiring Model Startups Actually Need
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Traditional hiring relies on resumes and trivia tests. Provento evaluates genuine code and realistic execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional Way */}
          <Card className="border-rose-100 bg-rose-50/30">
            <CardHeader>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600">The Traditional Model</div>
              <CardTitle className="text-xl text-slate-800">High Risk & Speculation</CardTitle>
              <CardDescription>CV → LeetCode Quiz → Behavioral Talk → Hire & Hope</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Resumes and degree certificates do not reflect day-to-day coding capability.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Algorithmic puzzles measure memorization rather than clean architecture and debugging.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Startups spend months dealing with costly mis-hires or long onboarding ramp-ups.</span>
              </div>
            </CardContent>
          </Card>

          {/* Provento Model */}
          <Card className="border-indigo-200 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/20">
            <CardHeader>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">The Provento Model</div>
              <CardTitle className="text-xl text-slate-900">Evidence Before Hiring</CardTitle>
              <CardDescription>Shortlist → Paid Realistic Project → Observe Actual Work → Hire with Confidence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Observe how a junior candidate writes tests, structures schemas, and handles real edge-cases.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Candidates get fairly compensated for their effort (e.g. ₹5,000 for a 5–10 hour sprint).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Every project produces verified professional proof for the candidate and hiring clarity for the startup.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Concrete Example Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 shadow-xl">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-700">
              Realistic Example
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Junior Backend Engineer Trial Project
            </h3>
            <p className="text-slate-300 text-base leading-relaxed">
              Instead of 4 rounds of whiteboard interviews, a logistics startup posts:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-xs text-slate-400 font-medium">Project</div>
                <div className="text-sm font-semibold text-white mt-1">REST API for Inventory Management</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-xs text-slate-400 font-medium">Standard Scope</div>
                <div className="text-sm font-semibold text-white mt-1">5–10 Hours · 5 Day Window</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className="text-xs text-slate-400 font-medium">Guaranteed Pay</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">₹5,000 Milestone</div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-300 pt-2 border-t border-slate-800">
              <div className="font-semibold text-white">Concrete Deliverables:</div>
              <p>• Working Node.js / PostgreSQL backend repository with clean schema migrations.</p>
              <p>• Secure token-based authentication & warehouse inventory CRUD endpoints.</p>
              <p>• Integration test suite covering critical paths + setup documentation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Roles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Standardized Evaluation Across Core Technical Roles
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          {[
            "Frontend Developer",
            "Backend Developer",
            "Full-stack Developer",
            "Software Engineer",
            "QA/Test Engineer",
            "Data Analyst",
            "Data Engineer",
            "AI/ML Engineer",
            "DevOps Engineer",
          ].map((role) => (
            <Badge key={role} variant="secondary" className="text-sm px-3.5 py-1.5 font-medium bg-slate-100 text-slate-700">
              {role}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
