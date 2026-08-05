export type ButtonType =
  | "instagram"
  | "whatsapp"
  | "google_review"
  | "pix"
  | "wifi"
  | "address"
  | "booking"
  | "custom";

export type Biosite = {
  id: string;
  owner_id: string;
  slug: string;
  business_name: string;
  description: string | null;
  template: string;
  logo_url: string | null;
  logo_shape: "round" | "square";
  cover_type: "image" | "video" | null;
  cover_url: string | null;
  primary_color: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ButtonConfig = {
  message?: string; // whatsapp initial message
  pix_key?: string;
  pix_key_type?: "cpf" | "cnpj" | "email" | "phone" | "random";
  pix_merchant_city?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  full_address?: string;
};

export type BiositeButton = {
  id: string;
  biosite_id: string;
  type: ButtonType;
  label: string | null;
  url: string | null;
  color: string | null;
  style: "full" | "icon";
  pulse: boolean;
  position: number;
  config: ButtonConfig;
};

export type CatalogGroup = {
  id: string;
  biosite_id: string;
  layout: "stacked" | "carousel";
  interval_seconds: number;
  position: number;
};

export type CatalogItem = {
  id: string;
  group_id: string;
  media_type: "image" | "video";
  media_url: string | null;
  aspect: "square" | "horizontal" | "vertical" | "original";
  title: string | null;
  description: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_align: "left" | "center" | "right";
  position: number;
};

export type Service = {
  id: string;
  biosite_id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
};

export type Staff = {
  id: string;
  biosite_id: string;
  name: string;
  photo_url: string | null;
};
