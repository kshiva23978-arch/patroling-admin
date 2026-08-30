"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inputClass, primaryButtonClass } from "@/lib/ui-classes";
import { formatDateTime } from "./PatrolDetails";
import { addPatrolCommentAction } from "./actions";
import type { PatrolCommentRef } from "@/lib/resources/patrollings";

/**
 * The admin panel's own discussion thread on a patrol entry — any admin with
 * manage access can add a comment, in any patrol status; comments carry who
 * added them (their employee id) and when. Separate from a ranger's own
 * in-app notes, and — like those — write-only: no editing or deleting once
 * posted. [comments] is owned by the parent (`PatrolDetails`/its caller) so
 * a newly-added comment stays visible across the page's periodic refetches.
 */
export function PatrolComments({
  entryId,
  comments,
  onCommentAdded,
}: {
  entryId: string;
  comments: PatrolCommentRef[];
  onCommentAdded: (comment: PatrolCommentRef) => void;
}) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await addPatrolCommentAction(entryId, trimmed);
      if (result.success) {
        onCommentAdded(result.comment);
        setText("");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-zinc-200 p-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-800">{comment.text}</p>
              <p className="mt-1.5 text-xs text-zinc-500">
                {comment.added_by ?? "Unknown"} • {formatDateTime(comment.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isPending}
        />
        <button type="submit" className={primaryButtonClass} disabled={isPending || !text.trim()}>
          {isPending ? "Adding…" : "Add Comment"}
        </button>
      </form>
    </div>
  );
}
