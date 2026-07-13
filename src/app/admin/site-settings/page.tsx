"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAllSiteSettingsAdmin, upsertSiteSettingAdmin, deleteSiteSettingAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import type { SiteSetting } from "@/types/domain";

const KNOWN_KEYS = [
  { key: "announcement_bar", example: '{ "text": "Feelz now at Zostel!", "enabled": true, "href": "/feelz" }' },
  { key: "homepage_stats", example: '{ "chips": ["10 strips per box", "1.5g total", "4 moods x 2.5mg"] }' },
];

export default function AdminSiteSettingsPage() {
  const confirmDialog = useConfirmDialog();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "site-settings"], queryFn: () => getAllSiteSettingsAdmin(createClient()) });
  const [editing, setEditing] = useState<SiteSetting | { key: string; value: unknown } | null>(null);
  const [key, setKey] = useState("");
  const [valueText, setValueText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(valueText);
      return upsertSiteSettingAdmin(createClient(), key, parsed);
    },
    onSuccess: () => {
      invalidate();
      setIsOpen(false);
    },
    onError: (err) => setJsonError(err instanceof Error ? err.message : "Invalid JSON"),
  });
  const remove = useMutation({
    mutationFn: (k: string) => deleteSiteSettingAdmin(createClient(), k),
    onSuccess: () => {
      setListError(null);
      invalidate();
    },
    onError: (err) => setListError(err instanceof Error ? err.message : "Failed to delete setting"),
  });

  function openNew(prefillKey = "") {
    setEditing(null);
    setKey(prefillKey);
    setValueText(prefillKey ? (KNOWN_KEYS.find((k) => k.key === prefillKey)?.example ?? "{}") : "{}");
    setJsonError(null);
    setIsOpen(true);
  }
  function openEdit(setting: SiteSetting) {
    setEditing(setting);
    setKey(setting.key);
    setValueText(JSON.stringify(setting.value, null, 2));
    setJsonError(null);
    setIsOpen(true);
  }

  const columns: AdminColumn<SiteSetting>[] = [
    { key: "key", label: "key", render: (s) => <span className="font-medium text-ink">{s.key}</span> },
    { key: "value", label: "value", render: (s) => <code className="block max-w-sm truncate text-xs text-ink/60">{JSON.stringify(s.value)}</code> },
  ];

  return (
    <div>
      <AdminPageHeader
        title="site settings"
        description="Generic key/value CMS store — powers the announcement bar and homepage stat chips."
        action={<button type="button" onClick={() => openNew()} className="pill-btn !py-2 text-xs">+ new key</button>}
      />

      {listError && <p className="mb-4 text-sm text-red-600">{listError}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {KNOWN_KEYS.filter((k) => !(query.data ?? []).some((s) => s.key === k.key)).map((k) => (
          <button key={k.key} type="button" onClick={() => openNew(k.key)} className="rounded-full border border-dashed border-ink/30 px-3 py-1.5 text-xs text-ink/60">
            + {k.key} (not set)
          </button>
        ))}
      </div>

      <AdminTable
        columns={columns}
        rows={query.data ?? []}
        getRowId={(s) => s.key}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={async (s) => {
          if (
            await confirmDialog({
              title: "delete setting",
              message: `Delete key "${s.key}"? If this powers the announcement bar or homepage stats, they'll fall back to defaults immediately.`,
              danger: true,
            })
          ) {
            remove.mutate(s.key);
          }
        }}
      />

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? `edit — ${key}` : "new setting"}>
        <div className="space-y-3">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="key" disabled={Boolean(editing)} className="input disabled:opacity-60" />
          <textarea value={valueText} onChange={(e) => setValueText(e.target.value)} rows={6} className="input font-mono text-xs" />
          {jsonError && <p className="text-sm text-red-600">{jsonError}</p>}
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending || !key} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
