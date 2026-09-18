"use client";

import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import {
  ProfileImageRemove,
  ProfileImageUpload,
} from "@/components/candidate/profile-image-upload";
import { removeCompanyLogoAction, saveCompanyLogoAction } from "@/lib/actions/company";

/** The company's logo, with upload and remove once the company exists. */
export function CompanyLogoEditor({
  userId,
  name,
  logoUrl,
  editable,
}: {
  userId: string;
  name: string;
  logoUrl: string | null;
  /** False until the company has been saved once — there is nothing to attach to. */
  editable: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-fib3">
      <div className="group relative h-24 w-24">
        <Avatar
          name={name || "Company"}
          src={logoUrl}
          className="h-24 w-24 rounded-2xl text-2xl ring-4 ring-white shadow-md"
        />
        {editable && (
          <ProfileImageUpload
            kind="logo"
            userId={userId}
            label={logoUrl ? "Change logo" : "Upload logo"}
            onError={setError}
            save={saveCompanyLogoAction}
            className="absolute inset-0 grid place-items-center rounded-2xl bg-ink-900/55 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Camera className="h-5 w-5" />
          </ProfileImageUpload>
        )}
        {editable && logoUrl && (
          <ProfileImageRemove
            kind="logo"
            label="Remove logo"
            onError={setError}
            remove={removeCompanyLogoAction}
            className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-ink-500 shadow-sm hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </ProfileImageRemove>
        )}
      </div>
      {error && (
        <p role="alert" className="max-w-[12rem] text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
