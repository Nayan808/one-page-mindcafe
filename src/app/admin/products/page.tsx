"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getProductsAdmin,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  createVariantAdmin,
  updateVariantAdmin,
  deleteVariantAdmin,
} from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { Modal } from "@/components/Modal";
import { formatInr } from "@/lib/utils";
import type { ProductWithVariants, ProductVariant } from "@/types/domain";

type ProductForm = { name: string; slug: string; description: string; price: string; image_url: string; is_active: boolean };
const EMPTY_PRODUCT: ProductForm = { name: "", slug: "", description: "", price: "", image_url: "", is_active: true };

type VariantForm = { variant_label: string; price_override: string; sku: string };
const EMPTY_VARIANT: VariantForm = { variant_label: "", price_override: "", sku: "" };

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: ["admin", "products"], queryFn: () => getProductsAdmin(createClient()) });
  const products = productsQuery.data ?? [];

  const [editing, setEditing] = useState<ProductWithVariants | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [variantsFor, setVariantsFor] = useState<ProductWithVariants | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(EMPTY_VARIANT);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

  const saveProduct = useMutation({
    mutationFn: async () => {
      const input = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        price: Number(form.price),
        image_url: form.image_url || null,
        is_active: form.is_active,
      };
      const sb = createClient();
      if (editing) return updateProductAdmin(sb, editing.id, input);
      return createProductAdmin(sb, input);
    },
    onSuccess: () => {
      invalidate();
      setIsFormOpen(false);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => deleteProductAdmin(createClient(), id),
    onSuccess: invalidate,
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_PRODUCT);
    setIsFormOpen(true);
  }
  function openEdit(product: ProductWithVariants) {
    setEditing(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      image_url: product.image_url ?? "",
      is_active: product.is_active,
    });
    setIsFormOpen(true);
  }

  const saveVariant = useMutation({
    mutationFn: async () => {
      const input = {
        variant_label: variantForm.variant_label,
        price_override: variantForm.price_override ? Number(variantForm.price_override) : null,
        sku: variantForm.sku || null,
      };
      const sb = createClient();
      if (editingVariant) return updateVariantAdmin(sb, editingVariant.id, input);
      return createVariantAdmin(sb, { ...input, product_id: variantsFor!.id });
    },
    onSuccess: () => {
      invalidate();
      setEditingVariant(null);
      setVariantForm(EMPTY_VARIANT);
    },
  });

  const deleteVariant = useMutation({
    mutationFn: (id: string) => deleteVariantAdmin(createClient(), id),
    onSuccess: invalidate,
  });

  const columns: AdminColumn<ProductWithVariants>[] = [
    { key: "name", label: "name", render: (p) => <span className="font-medium text-ink">{p.name}</span> },
    { key: "price", label: "price", render: (p) => <span>{formatInr(p.price)}</span> },
    { key: "variants", label: "variants", render: (p) => (
      <button type="button" onClick={() => setVariantsFor(p)} className="text-xs font-medium text-ink underline">
        {p.product_variants.length} — manage
      </button>
    ) },
    { key: "active", label: "active", render: (p) => <span>{p.is_active ? "yes" : "no"}</span> },
  ];

  return (
    <div>
      <AdminPageHeader
        title="products"
        description="Feelz catalog."
        action={<button type="button" onClick={openNew} className="pill-btn !py-2 text-xs">+ new product</button>}
      />

      <AdminTable
        columns={columns}
        rows={products}
        getRowId={(p) => p.id}
        isLoading={productsQuery.isLoading}
        onEdit={openEdit}
        onDelete={(p) => confirm(`Delete ${p.name}?`) && deleteProduct.mutate(p.id)}
      />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editing ? "edit product" : "new product"}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-ink/70">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Slug</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Price (₹)</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (shown on site)
          </label>
          <button type="button" onClick={() => saveProduct.mutate()} disabled={saveProduct.isPending} className="pill-btn w-full">
            {saveProduct.isPending ? "saving…" : "save"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(variantsFor)} onClose={() => setVariantsFor(null)} title={`variants — ${variantsFor?.name ?? ""}`}>
        <div className="space-y-3">
          {(variantsFor
            ? (products.find((p) => p.id === variantsFor.id)?.product_variants ?? [])
            : []
          ).map((variant) => (
            <div key={variant.id} className="rounded-lg border border-ink/15 p-3 text-sm">
              {editingVariant?.id === variant.id ? (
                <div className="space-y-2">
                  <input
                    value={variantForm.variant_label}
                    onChange={(e) => setVariantForm({ ...variantForm, variant_label: e.target.value })}
                    placeholder="Label"
                    className="input"
                  />
                  <input
                    value={variantForm.price_override}
                    onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value })}
                    placeholder="Price override (optional)"
                    className="input"
                  />
                  <input value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} placeholder="SKU (optional)" className="input" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveVariant.mutate()} className="pill-btn !py-1.5 text-xs">
                      save
                    </button>
                    <button type="button" onClick={() => setEditingVariant(null)} className="pill-btn-outline !py-1.5 text-xs">
                      cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>
                    {variant.variant_label}
                    {variant.price_override ? ` — ${formatInr(variant.price_override)}` : ""}
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVariant(variant);
                        setVariantForm({ variant_label: variant.variant_label, price_override: variant.price_override ? String(variant.price_override) : "", sku: variant.sku ?? "" });
                      }}
                      className="text-xs font-medium text-ink underline"
                    >
                      edit
                    </button>
                    <button type="button" onClick={() => deleteVariant.mutate(variant.id)} className="text-xs font-medium text-red-600 underline">
                      delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!editingVariant && (
            <div className="rounded-lg border border-dashed border-ink/20 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-label text-ink/50">add variant</p>
              <div className="space-y-2">
                <input value={variantForm.variant_label} onChange={(e) => setVariantForm({ ...variantForm, variant_label: e.target.value })} placeholder="Label (e.g. 10-pack)" className="input" />
                <input value={variantForm.price_override} onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value })} placeholder="Price override (optional)" className="input" />
                <input value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} placeholder="SKU (optional)" className="input" />
                <button type="button" onClick={() => saveVariant.mutate()} disabled={!variantForm.variant_label} className="pill-btn w-full !py-1.5 text-xs">
                  add variant
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
