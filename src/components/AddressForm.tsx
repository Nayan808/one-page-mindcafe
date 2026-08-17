"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { INDIA_STATES, CITIES_BY_STATE } from "@/lib/indiaLocations";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export const addressSchema = z.object({
  label: z.string().optional(),
  full_name: z.string().min(1, "Required"),
  phone: z.string().min(6, "Required"),
  line1: z.string().min(1, "Required"),
  line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  pincode: z.string().min(4, "Required"),
  landmark: z.string().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

type AddressFormProps = {
  onSubmit: (values: AddressFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  defaultValues?: Partial<AddressFormValues>;
};

// India Post's public pincode lookup (free, no key) — used to suggest
// pincodes for whatever city/state the customer just picked, rather than
// them having to know it off-hand. There's no clean city->pincode mapping
// worth hardcoding: a single city routinely spans a dozen+ pincodes, so
// this is a live lookup, not static data like INDIA_STATES/CITIES_BY_STATE.
type PostOffice = { Pincode: string; State: string };

async function fetchPincodesForCity(city: string, state: string): Promise<string[]> {
  const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error(`Pincode lookup failed: ${res.status}`);
  const data = (await res.json()) as Array<{ Status: string; PostOffice: PostOffice[] | null }>;
  const offices = data[0]?.PostOffice ?? [];

  // Prefer offices whose State matches the one already selected — the API
  // matches on name alone, so "Bhopal" could otherwise pull in an
  // unrelated place sharing the name in a different state. Falls back to
  // every result if that filter empties the list, rather than showing
  // nothing over an exact-match technicality.
  const inState = offices.filter((o) => o.State.toLowerCase() === state.toLowerCase());
  const relevant = inState.length > 0 ? inState : offices;
  return [...new Set(relevant.map((o) => o.Pincode))];
}

export function AddressForm({ onSubmit, isSubmitting, submitLabel = "Use This Address", defaultValues }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema), defaultValues });

  const selectedState = watch("state");
  const selectedCity = watch("city");
  const cityOptions = selectedState ? (CITIES_BY_STATE[selectedState] ?? []) : [];

  const debouncedCity = useDebouncedValue(selectedCity, 400);
  const [pincodeOptions, setPincodeOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!debouncedCity || !selectedState) {
      setPincodeOptions([]);
      return;
    }
    let cancelled = false;
    fetchPincodesForCity(debouncedCity, selectedState)
      .then((pincodes) => {
        if (cancelled) return;
        setPincodeOptions(pincodes);
        // A single unmistakable match is worth filling in automatically;
        // multiple candidates need the customer to actually pick the right
        // one via the datalist below rather than guessing for them.
        if (pincodes.length === 1) setValue("pincode", pincodes[0]);
      })
      .catch(() => {
        if (!cancelled) setPincodeOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCity, selectedState, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
      <Field label="Full Name" error={errors.full_name?.message}>
        <input {...register("full_name")} className="input" />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <input {...register("phone")} className="input" />
      </Field>
      <Field label="Address" error={errors.line1?.message} full>
        <input {...register("line1")} className="input" />
      </Field>
      <Field label="State" error={errors.state?.message}>
        <select {...register("state", { onChange: () => setValue("city", "") })} className="input">
          <option value="">Select state</option>
          {INDIA_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </Field>
      <Field label="City" error={errors.city?.message}>
        <input
          {...register("city")}
          className="input"
          list="city-options"
          autoComplete="off"
          disabled={!selectedState}
          placeholder={selectedState ? "Select or type a city" : "Select a state first"}
        />
        <datalist id="city-options">
          {cityOptions.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </Field>
      <Field label="Pincode" error={errors.pincode?.message}>
        <input
          {...register("pincode")}
          className="input"
          list="pincode-options"
          autoComplete="off"
          placeholder={pincodeOptions.length > 1 ? "Select or type a pincode" : "Pincode"}
        />
        <datalist id="pincode-options">
          {pincodeOptions.map((pincode) => (
            <option key={pincode} value={pincode} />
          ))}
        </datalist>
      </Field>
      <Field label="Landmark (optional)" error={errors.landmark?.message} full>
        <input {...register("landmark")} className="input" />
      </Field>

      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className="pill-btn">
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-sm text-ink/70">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
