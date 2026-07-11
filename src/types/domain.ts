import type { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type Product = Tables["products"]["Row"];
export type ProductVariant = Tables["product_variants"]["Row"];
export type PickupLocation = Tables["pickup_locations"]["Row"];
export type Address = Tables["addresses"]["Row"];
export type Cart = Tables["carts"]["Row"];
export type CartItem = Tables["cart_items"]["Row"];
export type Order = Tables["orders"]["Row"];
export type OrderItem = Tables["order_items"]["Row"];
export type Coupon = Tables["coupons"]["Row"];

export type ProductWithVariants = Product & { product_variants: ProductVariant[] };
export type CartItemWithVariant = CartItem & {
  product_variants: ProductVariant & { products: Pick<Product, "id" | "name" | "image_url" | "price"> };
};
export type OrderWithItems = Order & { order_items: OrderItem[] };
export type OrderItemWithVariant = OrderItem & {
  product_variants: Pick<ProductVariant, "variant_label"> & { products: Pick<Product, "name"> };
};
export type OrderWithItemDetails = Order & { order_items: OrderItemWithVariant[] };
