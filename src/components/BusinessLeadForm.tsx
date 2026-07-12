"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { submitBusinessLead } from "@/lib/api";

const leadSchema = z.object({
  company_name: z.string().min(1, "Required"),
  contact_name: z.string().min(1, "Required"),
  email: z.string().min(1, "Required").email("Enter a valid email"),
  phone: z.string().optional(),
  message: z.string().optional(),
});
type LeadValues = z.infer<typeof leadSchema>;

export function BusinessLeadForm() {
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadValues>({ resolver: zodResolver(leadSchema) });

  async function onSubmit(values: LeadValues) {
    await submitBusinessLead(createClient(), {
      companyName: values.company_name,
      contactName: values.contact_name,
      email: values.email,
      phone: values.phone || undefined,
      message: values.message || undefined,
    });
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-ink bg-white p-8 text-center">
        <h3 className="font-display text-xl font-bold lowercase text-ink">thanks — we&apos;ll be in touch</h3>
        <p className="mt-2 text-sm text-ink/60">Someone from our team will reach out within 1 business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-2xl border border-ink bg-white p-6 sm:p-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-ink/70">Organisation name</label>
          <input {...register("company_name")} className="input" />
          {errors.company_name && <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Your name</label>
          <input {...register("contact_name")} className="input" />
          {errors.contact_name && <p className="mt-1 text-xs text-red-600">{errors.contact_name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Work email</label>
          <input type="email" {...register("email")} className="input" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Phone (optional)</label>
          <input {...register("phone")} className="input" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-ink/70">Message (team size, what you&apos;re looking for, etc.)</label>
        <textarea {...register("message")} rows={3} className="input" />
      </div>
      <button type="submit" disabled={isSubmitting} className="pill-btn w-full">
        {isSubmitting ? "sending…" : "get in touch"}
      </button>
    </form>
  );
}
