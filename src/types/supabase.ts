// Hand-written subset of Mindcafe/frontend's Database type — only the
// tables this order page actually touches (products through order_items).
// Same Supabase project/schema; regenerate from there with
//   npx supabase gen types typescript --project-id <ref>
// if the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "ready_for_pickup"
  | "picked_up"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

type PaymentMethod = "razorpay" | "cash_on_pickup";
type PaymentStatus = "pending" | "pending_cash" | "paid" | "refund_required" | "refunded" | "failed";
type FulfillmentType = "delivery" | "takeaway";
type ProfileRole = "customer" | "expert" | "employer" | "admin";
type AuthProvider = "email" | "google";
type CartStatus = "active" | "merged" | "abandoned" | "converted";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          gender: string | null;
          auth_provider: AuthProvider;
          avatar_url: string | null;
          role: ProfileRole;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          name: string;
          slug: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          variant_label: string;
          price_override: number | null;
          sku: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & {
          product_id: string;
          variant_label: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      pickup_locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          lat: number | null;
          lng: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pickup_locations"]["Row"]> & {
          name: string;
          address: string;
          city: string;
        };
        Update: Partial<Database["public"]["Tables"]["pickup_locations"]["Row"]>;
        Relationships: [];
      };
      serviceable_pincodes: {
        Row: {
          id: string;
          pincode: string;
          city: string;
          delivery_fee: number;
          free_delivery_threshold: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["serviceable_pincodes"]["Row"]> & {
          pincode: string;
          city: string;
        };
        Update: Partial<Database["public"]["Tables"]["serviceable_pincodes"]["Row"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          pincode: string;
          landmark: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["addresses"]["Row"]> & {
          user_id: string;
          full_name: string;
          phone: string;
          line1: string;
          city: string;
          state: string;
          pincode: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Row"]>;
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          status: CartStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["carts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["carts"]["Row"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cart_items"]["Row"]> & {
          cart_id: string;
          variant_id: string;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_reservations: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          location_id: string | null;
          quantity: number;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stock_reservations"]["Row"]> & {
          cart_id: string;
          variant_id: string;
          quantity: number;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_reservations"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          source_cart_id: string | null;
          fulfillment_type: FulfillmentType;
          address_id: string | null;
          location_id: string | null;
          pickup_slot: string | null;
          status: OrderStatus;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          payment_ref: string | null;
          razorpay_order_id: string | null;
          shiprocket_order_id: string | null;
          shiprocket_shipment_id: string | null;
          awb_code: string | null;
          tracking_url: string | null;
          subtotal: number;
          delivery_fee: number;
          total: number;
          notes: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          guest_email: string | null;
          guest_address_line1: string | null;
          guest_address_line2: string | null;
          guest_address_city: string | null;
          guest_address_state: string | null;
          guest_address_pincode: string | null;
          coupon_code: string | null;
          discount_amount: number;
          pickup_code: string | null;
          pickup_code_collected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          fulfillment_type: FulfillmentType;
          payment_method: PaymentMethod;
          subtotal: number;
          total: number;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: "percent" | "fixed";
          discount_value: number;
          min_order_amount: number;
          max_discount_amount: number | null;
          is_active: boolean;
          expires_at: string | null;
          usage_limit: number | null;
          times_used: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["coupons"]["Row"]> & {
          code: string;
          discount_type: "percent" | "fixed";
          discount_value: number;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      available_stock: {
        Args: { p_variant_id: string; p_location_id: string | null };
        Returns: number;
      };
      create_stock_reservation: {
        Args: { p_cart_id: string; p_variant_id: string; p_location_id: string | null; p_quantity: number };
        Returns: string;
      };
      confirm_cash_order: {
        Args: { p_order_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
