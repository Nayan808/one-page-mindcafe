"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  deleteFeedbackAdmin,
  getFeedbackAdmin,
  publishFeedbackAsReviewAdmin,
  updateFeedbackStatusAdmin,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CsvDownloadButton } from "@/components/admin/CsvDownloadButton";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { formatDate } from "@/lib/utils";
import type { Feedback } from "@/types/domain";

const STATUSES: Feedback["status"][] = ["new", "reviewed", "published"];
const QUERY_KEY = ["admin", "feedback"];

// Share box: the public /feedback link, optionally tagged (?ref=) so each
// response shows which share it came from.
function ShareLink() {
  const [origin, setOrigin] = useState("");
  const [tag, setTag] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const cleanTag = tag.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const link = `${origin}/feedback${cleanTag ? `?ref=${cleanTag}` : ""}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mb-4 rounded-xl border border-ink/10 bg-white p-4">
      <p className="text-xs font-semibold text-ink">Share the feedback form</p>
      <p className="mt-0.5 text-xs text-ink/50">
        Send this link on WhatsApp, email or a QR code. Add a tag to see where each response came from (e.g. zostel-goa).
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="tag (optional)"
          className="input sm:!w-48"
        />
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-ink/15 bg-ink/[0.03] px-3 text-sm text-ink/70">
          <span className="truncate">{link}</span>
        </div>
        <button type="button" onClick={copy} className="pill-btn shrink-0">
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: () => getFeedbackAdmin(createClient()) });
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((f) =>
      [f.name, f.email, f.phone, f.message, f.product, f.source, f.topic].some((v) => v?.toLowerCase().includes(term)),
    );
  }, [query.data, search]);

  const average = useMemo(() => {
    const all = query.data ?? [];
    return all.length ? all.reduce((sum, f) => sum + f.rating, 0) / all.length : null;
  }, [query.data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const updateStatus = useMutation({
    mutationFn: (args: { id: string; status: Feedback["status"] }) =>
      updateFeedbackStatusAdmin(createClient(), args.id, args.status),
    onSettled: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteFeedbackAdmin(createClient(), id), onSettled: invalidate });
  const publish = useMutation({
    mutationFn: (feedback: Feedback) => publishFeedbackAsReviewAdmin(createClient(), feedback),
    onSettled: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const columns: AdminColumn<Feedback>[] = [
    { key: "date", label: "received", render: (f) => <span className="whitespace-nowrap text-ink/60">{formatDate(f.created_at)}</span> },
    {
      key: "rating",
      label: "rating",
      render: (f) => (
        <span className="flex gap-0.5 text-amber-400" aria-label={`${f.rating} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5" fill={i < f.rating ? "currentColor" : "none"} aria-hidden />
          ))}
        </span>
      ),
    },
    {
      key: "name",
      label: "name",
      render: (f) => (
        <span className="block">
          <span className="font-medium text-ink">{f.name}</span>
          {f.email && (
            <a href={`mailto:${f.email}`} className="block text-xs text-ink/60 underline">
              {f.email}
            </a>
          )}
          {f.phone && (
            <a href={`tel:${f.phone}`} className="block text-xs text-ink/60">
              {f.phone}
            </a>
          )}
        </span>
      ),
    },
    {
      key: "about",
      label: "about",
      render: (f) => (
        <span className="text-ink/70 capitalize">
          {f.topic}
          {f.product ? ` · ${f.product}` : ""}
        </span>
      ),
    },
    {
      key: "message",
      label: "feedback",
      render: (f) => (
        <span className="block max-w-sm whitespace-pre-line text-ink/70" title={f.message}>
          {f.message}
        </span>
      ),
    },
    { key: "source", label: "source", render: (f) => <span className="text-ink/60">{f.source ?? "—"}</span> },
    {
      key: "publish",
      label: "on website",
      render: (f) =>
        f.status === "published" ? (
          <span className="text-xs font-medium text-emerald-700">published</span>
        ) : f.can_publish ? (
          <button
            type="button"
            disabled={publish.isPending}
            onClick={async () => {
              if (
                await confirmDialog({
                  title: "publish as testimonial",
                  message: `Show ${f.name}'s feedback (${f.rating}★) in the testimonials on the website?`,
                })
              ) {
                publish.mutate(f);
              }
            }}
            className="pill-btn-outline !py-1 text-xs"
          >
            publish
          </button>
        ) : (
          <span className="text-xs text-ink/40">not allowed</span>
        ),
    },
    {
      key: "status",
      label: "status",
      render: (f) => (
        <select
          value={f.status}
          onChange={(e) => updateStatus.mutate({ id: f.id, status: e.target.value as Feedback["status"] })}
          className="input !w-auto !py-1.5 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  const total = query.data?.length ?? 0;
  return (
    <div>
      <AdminPageHeader
        title="feedback"
        description={`${rows.length} of ${total} total${average !== null ? ` · average ${average.toFixed(1)}★` : ""}`}
        action={<CsvDownloadButton filename="feedback" rows={rows} />}
      />
      <ShareLink />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name, contact, product, tag, or feedback…" />
      <AdminTable
        columns={columns}
        rows={rows}
        getRowId={(f) => f.id}
        isLoading={query.isLoading}
        onDelete={async (f) => {
          if (await confirmDialog({ title: "delete feedback", message: `Delete this feedback from "${f.name}"?`, danger: true })) {
            remove.mutate(f.id);
          }
        }}
        emptyLabel="No feedback yet — share the link above to start collecting it."
      />
    </div>
  );
}
