"use client";

import { useState, useTransition, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Pencil, Trash2, X, Check } from "lucide-react";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    profile: { fullName: string | null; avatarUrl: string | null } | null;
  };
}

interface Props {
  activityId: string;
  currentUserId: string;
  activityOwnerId: string;
  initialComments: Comment[];
  initialNextCursor: string | null;
}

export function CommentSection({
  activityId,
  currentUserId,
  activityOwnerId,
  initialComments,
  initialNextCursor,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || isPending) return;

    setNewComment("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/activities/${activityId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const json = await res.json();
          setComments((prev) => [...prev, json.data]);
        }
      } catch {
        // silent
      }
    });
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  function submitEdit(commentId: string) {
    const content = editContent.trim();
    if (!content || isPending) return;
    cancelEdit();

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const json = await res.json();
          setComments((prev) => prev.map((c) => (c.id === commentId ? json.data : c)));
        }
      } catch {
        // silent
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/comments/${commentId}`, { method: "DELETE" });
        if (res.ok) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        }
      } catch {
        // silent
      }
    });
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/v1/activities/${activityId}/comments?cursor=${nextCursor}`);
      if (res.ok) {
        const json = await res.json();
        setComments((prev) => [...prev, ...json.data.comments]);
        setNextCursor(json.data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <div className="space-y-3">
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => {
            const canEdit = comment.user.id === currentUserId;
            const canDelete = comment.user.id === currentUserId || activityOwnerId === currentUserId;
            const isEditing = editingId === comment.id;
            const displayName = comment.user.profile?.fullName ?? comment.user.username;

            return (
              <div key={comment.id} className="flex gap-2 group">
                <div className="h-6 w-6 rounded-full bg-secondary flex-shrink-0 overflow-hidden mt-0.5">
                  {comment.user.profile?.avatarUrl ? (
                    <img src={comment.user.profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/u/${comment.user.username}`} className="text-xs font-medium hover:underline">
                      {displayName}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-[10px] text-muted-foreground">(edited)</span>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        maxLength={500}
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(comment.id); }
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <button onClick={() => submitEdit(comment.id)} className="text-green-500 hover:text-green-400">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/90 mt-0.5 break-words">{comment.content}</p>
                  )}
                </div>
                {!isEditing && (canEdit || canDelete) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {canEdit && (
                      <button onClick={() => startEdit(comment)} className="text-muted-foreground hover:text-foreground p-0.5">
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(comment.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="text-xs text-primary hover:underline"
            >
              {isLoadingMore ? "Loading…" : "Load more comments"}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          rows={1}
          maxLength={500}
          className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
          }}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isPending}
          className="text-primary hover:text-primary/80 disabled:opacity-40 p-1"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
