"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  removeProfileImageAction,
  saveProfileImageAction,
} from "@/lib/actions/candidate";
import {
  PROFILE_MEDIA,
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_TYPES,
  type ProfileMediaKind,
} from "@/lib/constants";
import type { ActionResponse } from "@/lib/types/actions";

function describeStorageError(message: string): string {
  if (/bucket not found/i.test(message)) {
    return "Image uploads aren't set up yet. Apply the profile media migration first.";
  }
  if (/row-level security|unauthorized|not allowed/i.test(message)) {
    return "You don't have permission to upload this image.";
  }
  return "The upload failed. Please try again.";
}

/**
 * Uploads straight from the browser to Supabase Storage, which keeps images off
 * the server-action request (Next caps those bodies at 1 MB). Storage policies
 * confine each user to their own folder; the action then records the URL.
 */
export function ProfileImageUpload({
  kind,
  userId,
  className,
  label,
  onError,
  save = () => saveProfileImageAction(kind),
  children,
}: {
  kind: ProfileMediaKind;
  userId: string;
  className?: string;
  label: string;
  onError: (message: string | null) => void;
  /** Records the uploaded file. Defaults to the candidate's avatar/banner. */
  save?: () => Promise<ActionResponse>;
  children: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const upload = async (file: File) => {
    const { maxBytes, label: kindLabel } = PROFILE_MEDIA[kind];

    if (!(PROFILE_MEDIA_TYPES as readonly string[]).includes(file.type)) {
      onError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > maxBytes) {
      onError(`${kindLabel} must be under ${maxBytes / (1024 * 1024)} MB.`);
      return;
    }

    setPending(true);
    onError(null);

    const { error } = await createClient()
      .storage.from(PROFILE_MEDIA_BUCKET)
      .upload(`${userId}/${kind}`, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (error) {
      onError(describeStorageError(error.message));
    } else {
      const result = await save();
      if (result.error) onError(result.error);
      else router.refresh();
    }
    setPending(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_MEDIA_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        aria-label={label}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
    </>
  );
}

export function ProfileImageRemove({
  kind,
  className,
  label,
  onError,
  remove = () => removeProfileImageAction(kind),
  children,
}: {
  kind: ProfileMediaKind;
  className?: string;
  label?: string;
  onError: (message: string | null) => void;
  remove?: () => Promise<ActionResponse>;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      className={className}
      onClick={async () => {
        setPending(true);
        onError(null);
        const result = await remove();
        if (result.error) onError(result.error);
        else router.refresh();
        setPending(false);
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
