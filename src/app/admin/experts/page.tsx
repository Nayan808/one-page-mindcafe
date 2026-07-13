"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getAllExpertsAdmin,
  updateExpertAdmin,
  deleteExpertAdmin,
  listUsersAdmin,
  linkExistingUserAsExpertAdmin,
  unlinkExpertAdmin,
  uploadExpertPhotoAdmin,
} from "@/lib/admin-api";
import { useAuth } from "@/contexts/AuthContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { Modal } from "@/components/Modal";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { VALID_CATEGORY_SLUGS } from "@/lib/therapyCategories";
import type { Expert } from "@/types/domain";

type EditForm = { name: string; photo_url: string; bio: string; specialties: string[]; certifications: string; is_active: boolean; rating: string };
type CreateForm = { email: string; password: string; name: string; photo_url: string; bio: string; certifications: string };
const EMPTY_CREATE: CreateForm = { email: "", password: "", name: "", photo_url: "", bio: "", certifications: "" };

// Shared by both the edit and create-account forms — a URL field (for
// photos already hosted somewhere) plus a direct upload straight into the
// expert-photos storage bucket, so an admin doesn't need to find image
// hosting first just to add a photo.
function PhotoUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const url = await uploadExpertPhotoAdmin(createClient(), file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-full border border-ink/15 object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-ink/25 text-center text-[9px] leading-tight text-ink/40">
            no photo
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Photo URL" className="input" />
          <label className="pill-btn-outline flex w-full cursor-pointer items-center justify-center !py-1.5 text-xs">
            {isUploading ? "uploading…" : "upload a photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}

export default function AdminExpertsPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";
  const confirmDialog = useConfirmDialog();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "experts", "all"], queryFn: () => getAllExpertsAdmin(createClient()) });
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter((e) => e.name.toLowerCase().includes(term) || e.specialties.some((s) => s.toLowerCase().includes(term)));
  }, [query.data, search]);

  const [editing, setEditing] = useState<Expert | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [linkUserId, setLinkUserId] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listUsersAdmin(createClient()),
    enabled: Boolean(editing) && !editing?.profile_id,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<{ email: string; password: string } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "experts"] });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editing || !editForm) return;
      await updateExpertAdmin(createClient(), editing.id, {
        name: editForm.name,
        photo_url: editForm.photo_url || null,
        bio: editForm.bio || null,
        specialties: editForm.specialties,
        certifications: editForm.certifications.split(",").map((s) => s.trim()).filter(Boolean),
        is_active: editForm.is_active,
        rating: editForm.rating ? Number(editForm.rating) : null,
      });
    },
    onSuccess: () => {
      setEditError(null);
      invalidate();
      setEditing(null);
    },
    onError: (err) => setEditError(err instanceof Error ? err.message : "Failed to save changes"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExpertAdmin(createClient(), id),
    onSuccess: () => {
      setListError(null);
      invalidate();
    },
    onError: (err) => setListError(err instanceof Error ? err.message : "Failed to delete expert"),
  });

  const linkUser = useMutation({
    mutationFn: () => linkExistingUserAsExpertAdmin(createClient(), editing!.id, linkUserId),
    onSuccess: () => {
      invalidate();
      setLinkError(null);
      setEditing(null);
    },
    onError: (err) => setLinkError(err instanceof Error ? err.message : "Failed to link account"),
  });

  const unlinkUser = useMutation({
    mutationFn: () => unlinkExpertAdmin(createClient(), editing!.id),
    onSuccess: () => {
      setEditError(null);
      invalidate();
      setEditing(null);
    },
    onError: (err) => setEditError(err instanceof Error ? err.message : "Failed to unlink account"),
  });

  const createExpert = useMutation({
    mutationFn: async () => {
      const sb = createClient();
      const { data, error } = await sb.functions.invoke("admin-create-expert", {
        body: {
          email: createForm.email,
          password: createForm.password,
          name: createForm.name,
          photo_url: createForm.photo_url || undefined,
          bio: createForm.bio || undefined,
          certifications: createForm.certifications
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      if (error) {
        const detail = await (error as { context?: Response }).context?.json?.().catch(() => null);
        throw new Error(detail?.error ?? error.message);
      }
      return data;
    },
    onSuccess: () => {
      setCreateResult({ email: createForm.email, password: createForm.password });
      setCreateError(null);
      invalidate();
    },
    onError: (err) => setCreateError(err instanceof Error ? err.message : "Failed to create expert"),
  });

  function openEdit(expert: Expert) {
    setEditing(expert);
    setEditForm({
      name: expert.name,
      photo_url: expert.photo_url ?? "",
      bio: expert.bio ?? "",
      specialties: expert.specialties,
      certifications: expert.certifications.join(", "),
      is_active: expert.is_active,
      rating: expert.rating ? String(expert.rating) : "",
    });
    setLinkUserId("");
    setLinkError(null);
    setEditError(null);
  }

  function openCreate() {
    setCreateForm(EMPTY_CREATE);
    setCreateResult(null);
    setCreateError(null);
    setCreateOpen(true);
  }

  const columns: AdminColumn<Expert>[] = [
    { key: "name", label: "name", render: (e) => <span className="font-medium text-ink">{e.name}</span> },
    { key: "login", label: "login access", render: (e) => <span>{e.profile_id ? "yes" : "no"}</span> },
    { key: "specialties", label: "specialties", render: (e) => <span className="text-ink/60">{e.specialties.join(", ") || "—"}</span> },
    { key: "active", label: "active", render: (e) => <span>{e.is_active ? "yes" : "no"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="experts" action={<button type="button" onClick={openCreate} className="pill-btn !py-2 text-xs">+ create expert account</button>} />
      {listError && <p className="mb-4 text-sm text-red-600">{listError}</p>}
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search by name or specialty…" />
      <AdminTable
        columns={columns}
        rows={rows}
        getRowId={(e) => e.id}
        isLoading={query.isLoading}
        onEdit={openEdit}
        onDelete={async (e) => {
          if (
            await confirmDialog({
              title: "delete expert",
              message: `Delete "${e.name}"? This does not delete their login account if they have one.`,
              danger: true,
            })
          ) {
            remove.mutate(e.id);
          }
        }}
      />

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={`edit — ${editing?.name ?? ""}`}>
        {editForm && (
          <div className="space-y-3">
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="input" />
            <PhotoUploadField value={editForm.photo_url} onChange={(url) => setEditForm({ ...editForm, photo_url: url })} />
            <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Bio" rows={3} className="input" />
            <input value={editForm.certifications} onChange={(e) => setEditForm({ ...editForm, certifications: e.target.value })} placeholder="Certifications (comma-separated)" className="input" />
            <div>
              <p className="mb-1 text-sm text-ink/70">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {VALID_CATEGORY_SLUGS.map((slug) => (
                  <label key={slug} className="flex items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={editForm.specialties.includes(slug)}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          specialties: e.target.checked ? [...editForm.specialties, slug] : editForm.specialties.filter((s) => s !== slug),
                        })
                      }
                    />
                    {slug}
                  </label>
                ))}
              </div>
            </div>
            <input value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} placeholder="Rating (0-5, optional)" type="number" step="0.1" min="0" max="5" className="input" />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
              Active (shown in directory)
            </label>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <button type="button" onClick={() => saveEdit.mutate()} disabled={saveEdit.isPending} className="pill-btn w-full">
              {saveEdit.isPending ? "saving…" : "save"}
            </button>

            <div className="border-t border-ink/10 pt-3">
              <p className="mb-1 text-sm font-medium text-ink">login access</p>
              {editing?.profile_id ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-ink/15 bg-cream/60 p-3 text-sm">
                  <span className="text-emerald-700">Linked to an account.</span>
                  {isSuperAdmin ? (
                    <button type="button" onClick={() => unlinkUser.mutate()} disabled={unlinkUser.isPending} className="text-xs font-medium text-red-600 underline">
                      unlink
                    </button>
                  ) : (
                    <span className="text-xs text-ink/40">super_admin-only to unlink</span>
                  )}
                </div>
              ) : isSuperAdmin ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink/50">
                    Not linked — if this person already signed up (e.g. via Google), link their existing account
                    here instead of creating a new one with &quot;create expert account&quot;.
                  </p>
                  <select value={linkUserId} onChange={(e) => setLinkUserId(e.target.value)} className="input">
                    <option value="">
                      {usersQuery.isLoading ? "Loading accounts…" : "Select an account"}
                    </option>
                    {(usersQuery.data ?? [])
                      .filter((u) => u.role === "customer")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email} {u.full_name ? `(${u.full_name})` : ""}
                        </option>
                      ))}
                  </select>
                  {linkError && <p className="text-xs text-red-600">{linkError}</p>}
                  <button type="button" onClick={() => linkUser.mutate()} disabled={!linkUserId || linkUser.isPending} className="pill-btn-outline w-full !py-2 text-xs">
                    {linkUser.isPending ? "linking…" : "link this account"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink/50">
                  Not linked — linking an existing account requires super_admin (it changes the account&apos;s role).
                  Use &quot;create expert account&quot; for a brand-new login, or ask a super_admin to link one here.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="create expert account">
        {createResult ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-emerald-700">Account created.</p>
            <div className="rounded-lg border border-ink/15 bg-cream/60 p-3 text-left text-sm">
              <p>Email: {createResult.email}</p>
              <p>Password: {createResult.password}</p>
            </div>
            <p className="text-xs text-ink/50">Save this password now — it won&apos;t be shown again. Share it with them securely.</p>
            <button type="button" onClick={() => setCreateOpen(false)} className="pill-btn w-full">
              done
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Full name" className="input" />
            <input value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="Email" type="email" className="input" />
            <input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Temporary password" className="input" />
            <PhotoUploadField value={createForm.photo_url} onChange={(url) => setCreateForm({ ...createForm, photo_url: url })} />
            <input value={createForm.certifications} onChange={(e) => setCreateForm({ ...createForm, certifications: e.target.value })} placeholder="Certifications, comma-separated (optional)" className="input" />
            <textarea value={createForm.bio} onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })} placeholder="Bio (optional)" rows={2} className="input" />
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <button
              type="button"
              onClick={() => createExpert.mutate()}
              disabled={createExpert.isPending || !createForm.email || !createForm.password || !createForm.name}
              className="pill-btn w-full"
            >
              {createExpert.isPending ? "creating…" : "create account"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
