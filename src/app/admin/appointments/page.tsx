"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getAppointmentsAdmin, updateAppointmentAdmin, getAllExpertsAdmin } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable, type AdminColumn } from "@/components/admin/AdminTable";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { FilterDropdown, type FilterOption } from "@/components/admin/FilterDropdown";
import { Modal } from "@/components/Modal";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { formatInr } from "@/lib/utils";
import type { AppointmentWithDetails } from "@/types/domain";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "all statuses" },
  ...STATUSES.map((s) => ({ value: s, label: s })),
];

export default function AdminAppointmentsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [detailsAppointment, setDetailsAppointment] = useState<AppointmentWithDetails | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const appointmentsQueryKey = ["admin", "appointments", page, status, debouncedSearch] as const;

  const appointmentsQuery = useQuery({
    queryKey: appointmentsQueryKey,
    queryFn: () => getAppointmentsAdmin(createClient(), { page, pageSize: PAGE_SIZE, status: status || undefined, search: debouncedSearch || undefined }),
  });

  const expertsQuery = useQuery({
    queryKey: ["admin", "experts", "all"],
    queryFn: () => getAllExpertsAdmin(createClient()),
  });

  // Live: new bookings / status changes show up without a manual refresh.
  // Broad invalidate (just the ["admin", "appointments"] prefix, not the
  // exact paginated/filtered key) so whichever page or filter is
  // currently active just refetches itself — a targeted key won't help
  // here since a new row might not even belong on the current page.
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("admin-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }),
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [queryClient]);

  // Optimistic: the status/expert selects flip instantly instead of
  // waiting on a full 20-row page refetch to come back first.
  const update = useMutation({
    mutationFn: (args: { id: string; input: Parameters<typeof updateAppointmentAdmin>[2] }) =>
      updateAppointmentAdmin(createClient(), args.id, args.input),
    onMutate: async (args) => {
      await queryClient.cancelQueries({ queryKey: appointmentsQueryKey });
      const previous = queryClient.getQueryData<{ appointments: AppointmentWithDetails[]; total: number }>(appointmentsQueryKey);
      queryClient.setQueryData<{ appointments: AppointmentWithDetails[]; total: number }>(appointmentsQueryKey, (old) =>
        old && {
          ...old,
          appointments: old.appointments.map((a) => (a.id === args.id ? { ...a, ...args.input } : a)),
        },
      );
      return { previous };
    },
    onError: (_err, _args, context) => {
      if (context?.previous) queryClient.setQueryData(appointmentsQueryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }),
  });

  const appointments = appointmentsQuery.data?.appointments ?? [];
  const total = appointmentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const experts = expertsQuery.data ?? [];

  const columns: AdminColumn<AppointmentWithDetails>[] = [
    {
      key: "customer",
      label: "customer",
      render: (a) => (
        <div>
          <p className="font-medium text-ink">{a.profiles?.full_name ?? "—"}</p>
          <p className="text-ink/50">{a.profiles?.phone ?? "—"}</p>
        </div>
      ),
    },
    { key: "category", label: "category", render: (a) => <span className="capitalize">{a.therapy_category.replace(/-/g, " ")}</span> },
    {
      key: "expert",
      label: "expert",
      render: (a) => (
        <select
          value={a.expert_id ?? ""}
          onChange={(e) => update.mutate({ id: a.id, input: { expert_id: e.target.value || null } })}
          className="input !w-auto !py-1.5 text-xs"
        >
          <option value="">Unassigned</option>
          {experts.map((expert) => (
            <option key={expert.id} value={expert.id}>
              {expert.name}
            </option>
          ))}
        </select>
      ),
    },
    { key: "when", label: "requested time", render: (a) => <span className="text-ink/60">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : "—"}</span> },
    {
      key: "payment",
      label: "payment",
      render: (a) => (
        <div>
          <p className="font-medium text-ink">{formatInr(a.total ?? 0)}</p>
          <p className="capitalize text-ink/50">{a.payment_status}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "status",
      render: (a) => (
        <select
          value={a.status}
          onChange={(e) => update.mutate({ id: a.id, input: { status: e.target.value as AppointmentWithDetails["status"] } })}
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
    {
      key: "details",
      label: "",
      render: (a) => (
        <button type="button" onClick={() => setDetailsAppointment(a)} className="text-xs font-medium text-ink underline">
          details
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="appointments" description={`${total} total`} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AdminSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search by notes or category…"
          wrapperClassName="max-w-sm flex-1"
        />
        <FilterDropdown
          options={STATUS_FILTER_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          searchPlaceholder="Search statuses…"
        />
      </div>

      <AdminTable columns={columns} rows={appointments} getRowId={(a) => a.id} isLoading={appointmentsQuery.isLoading} emptyLabel="No appointments." />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="pill-btn-outline !py-1.5 disabled:opacity-40">
            previous
          </button>
          <span className="text-ink/50">
            page {page + 1} of {totalPages}
          </span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="pill-btn-outline !py-1.5 disabled:opacity-40">
            next
          </button>
        </div>
      )}

      <Modal isOpen={!!detailsAppointment} onClose={() => setDetailsAppointment(null)} title="appointment details">
        {detailsAppointment && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">customer</p>
              <p className="mt-1 text-ink">{detailsAppointment.profiles?.full_name ?? "—"}</p>
              <p className="text-ink/60">{detailsAppointment.profiles?.phone ?? "—"}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">payment</p>
              <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-ink/70">
                <dt className="text-ink/40">price</dt>
                <dd>{formatInr(detailsAppointment.price ?? 0)}</dd>
                <dt className="text-ink/40">discount</dt>
                <dd>{formatInr(detailsAppointment.discount_amount ?? 0)}</dd>
                <dt className="text-ink/40">coupon</dt>
                <dd>{detailsAppointment.coupon_code ?? "—"}</dd>
                <dt className="text-ink/40">total</dt>
                <dd className="font-medium text-ink">{formatInr(detailsAppointment.total ?? 0)}</dd>
                <dt className="text-ink/40">payment status</dt>
                <dd className="capitalize">{detailsAppointment.payment_status}</dd>
              </dl>
            </div>

            {detailsAppointment.meet_link && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">meet link</p>
                <a href={detailsAppointment.meet_link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-ink underline">
                  {detailsAppointment.meet_link}
                </a>
              </div>
            )}

            {detailsAppointment.intake_completed_at ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">client intake</p>
                <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-ink/70">
                  {detailsAppointment.intake_age && (
                    <>
                      <dt className="text-ink/40">age</dt>
                      <dd>{detailsAppointment.intake_age}</dd>
                    </>
                  )}
                  {detailsAppointment.intake_pronouns && (
                    <>
                      <dt className="text-ink/40">pronouns</dt>
                      <dd>{detailsAppointment.intake_pronouns}</dd>
                    </>
                  )}
                  {detailsAppointment.intake_occupation && (
                    <>
                      <dt className="text-ink/40">occupation</dt>
                      <dd>{detailsAppointment.intake_occupation}</dd>
                    </>
                  )}
                  {detailsAppointment.intake_concern && (
                    <>
                      <dt className="text-ink/40">concern</dt>
                      <dd>{detailsAppointment.intake_concern}</dd>
                    </>
                  )}
                </dl>
                {detailsAppointment.intake_description && (
                  <p className="mt-2 text-ink/70">
                    <span className="text-ink/40">what brought them here: </span>
                    {detailsAppointment.intake_description}
                  </p>
                )}
                {Array.isArray(detailsAppointment.intake_answers) && detailsAppointment.intake_answers.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-ink/10 pt-2">
                    {(detailsAppointment.intake_answers as unknown as { question: string; answer: string }[]).map((qa, i) => (
                      <p key={i} className="text-ink/70">
                        <span className="text-ink/40">{qa.question} </span>
                        <span className="font-medium text-ink">{qa.answer}</span>
                      </p>
                    ))}
                  </div>
                )}
                {!detailsAppointment.intake_concern &&
                  (detailsAppointment.intake_energy_level || detailsAppointment.intake_comfort_level || detailsAppointment.intake_self_perception) && (
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-ink/10 pt-2 text-ink/70">
                      {detailsAppointment.intake_energy_level && (
                        <>
                          <dt className="text-ink/40">energy</dt>
                          <dd className="capitalize">{detailsAppointment.intake_energy_level}</dd>
                        </>
                      )}
                      {detailsAppointment.intake_comfort_level && (
                        <>
                          <dt className="text-ink/40">comfort</dt>
                          <dd className="capitalize">{detailsAppointment.intake_comfort_level}</dd>
                        </>
                      )}
                      {detailsAppointment.intake_self_perception && (
                        <>
                          <dt className="text-ink/40">self-perception</dt>
                          <dd className="capitalize">{detailsAppointment.intake_self_perception}</dd>
                        </>
                      )}
                    </dl>
                  )}
              </div>
            ) : (
              <p className="text-xs text-ink/50">Client hasn&apos;t completed the intake form yet.</p>
            )}

            <div className="border-t border-ink/10 pt-3 text-xs text-ink/50">
              <p>booked {new Date(detailsAppointment.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
