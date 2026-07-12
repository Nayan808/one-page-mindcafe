"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getTherapyCategories } from "@/lib/api";
import { updateTherapyCategoryAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Modal } from "@/components/Modal";
import type { TherapyCategory } from "@/types/domain";

export default function AdminTherapyCategoriesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "therapy-categories"], queryFn: () => getTherapyCategories(createClient()) });
  const [editing, setEditing] = useState<TherapyCategory | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [heroImage, setHeroImage] = useState("");

  const save = useMutation({
    mutationFn: () => updateTherapyCategoryAdmin(createClient(), editing!.slug, { title, body, hero_image: heroImage || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "therapy-categories"] });
      setEditing(null);
    },
  });

  function openEdit(category: TherapyCategory) {
    setEditing(category);
    setTitle(category.title);
    setBody(category.body);
    setHeroImage(category.hero_image ?? "");
  }

  return (
    <div>
      <AdminPageHeader title="therapy categories" description="These 4 are fixed slugs — edit their copy, not their existence." />

      <div className="space-y-3">
        {(query.data ?? []).map((category) => (
          <div key={category.slug} className="rounded-xl border border-ink/15 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-base font-bold text-ink">{category.title}</p>
                <p className="text-xs text-ink/50">/{category.slug}</p>
              </div>
              <button type="button" onClick={() => openEdit(category)} className="pill-btn-outline !py-1.5 text-xs">
                edit
              </button>
            </div>
            <p className="mt-2 text-sm text-ink/60">{category.body}</p>
          </div>
        ))}
      </div>

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title={`edit — ${editing?.title ?? ""}`}>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={4} className="input" />
          <input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="Hero image URL (optional)" className="input" />
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="pill-btn w-full">
            {save.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
