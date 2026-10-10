// Storefront copy of the automatic discount rule that create-order
// (supabase/functions/create-order) actually charges — keep the two in
// sync by hand. The Feelz Bundle is always exactly its own price; every
// other item gets 10% off once those non-bundle items alone total ₹300+
// (e.g. 2 × Joy = ₹580 → ₹58 off; bundle + 1 Joy → nothing off the Joy).
// Never stacked with a coupon: the larger of the two wins.
export const AUTO_DISCOUNT_MIN_SUBTOTAL = 300;
export const AUTO_DISCOUNT_PERCENT = 0.1;

type PricedLine = {
  quantity: number;
  product_variants: { price_override: number | null; products: { price: number; is_bundle?: boolean | null } };
};

export function unitPriceOf(line: PricedLine) {
  return line.product_variants.price_override ?? line.product_variants.products.price;
}

export function isBundleLine(line: PricedLine) {
  return !!line.product_variants.products.is_bundle;
}

/** Subtotal of everything except the bundle — what discounts apply to. */
export function discountableSubtotal(lines: PricedLine[]) {
  return lines.filter((line) => !isBundleLine(line)).reduce((sum, line) => sum + unitPriceOf(line) * line.quantity, 0);
}

export function autoDiscountFor(lines: PricedLine[]) {
  const base = discountableSubtotal(lines);
  return base >= AUTO_DISCOUNT_MIN_SUBTOTAL ? Math.round(base * AUTO_DISCOUNT_PERCENT * 100) / 100 : 0;
}
