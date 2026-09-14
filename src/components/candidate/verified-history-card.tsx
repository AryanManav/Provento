import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, CheckCircle2, Award, Building, Calendar } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface VerifiedTrialItem {
  id: string;
  projectTitle: string;
  companyName: string;
  completedAt: string;
  paymentAmount: number;
  currency: string;
  requirementsCompleted: boolean;
  technicalQuality: string;
  writtenFeedback: string;
  outcome: string | null;
}

interface VerifiedHistoryCardProps {
  trials: VerifiedTrialItem[];
}

export function VerifiedHistoryCard({ trials }: VerifiedHistoryCardProps) {
  return (
    <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-[#191919]">Verified Work History</h2>
          <span className="text-xs text-slate-500 font-normal">({trials.length})</span>
        </div>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-medium text-xs">
          Guaranteed Paid Trials
        </Badge>
      </div>

      {trials.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No verified trial projects yet</p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
            When you complete a paid project for a startup on Provento, their technical evaluation and feedback will appear here as permanent verified proof.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {trials.map((trial) => (
            <div
              key={trial.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="font-bold text-sm text-[#191919]">{trial.projectTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Building className="h-3 w-3" /> {trial.companyName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(trial.completedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600">
                    {formatCurrency(trial.paymentAmount, trial.currency)} Paid
                  </span>
                  {trial.outcome === "hire" && (
                    <Badge variant="success" className="text-[10px]">Hired</Badge>
                  )}
                  {trial.outcome === "interview" && (
                    <Badge variant="default" className="text-[10px]">Interview Extended</Badge>
                  )}
                </div>
              </div>

              {trial.writtenFeedback && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 italic">
                  &ldquo;{trial.writtenFeedback}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
