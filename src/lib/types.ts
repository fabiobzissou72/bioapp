export type ButtonType =
  | "instagram"
  | "whatsapp"
  | "google_review"
  | "pix"
  | "wifi"
  | "address"
  | "booking"
  | "custom"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x_twitter"
  | "linkedin"
  | "threads"
  | "telegram"
  | "pinterest"
  | "snapchat"
  | "twitch"
  | "spotify"
  | "site"
  | "phone"
  | "email"
  | "quote";

export type Biosite = {
  id: string;
  owner_id: string;
  slug: string;
  business_name: string;
  description: string | null;
  template: string;
  logo_url: string | null;
  logo_shape: "round" | "square";
  logo_transparent: boolean;
  cover_type: "image" | "video" | null;
  cover_url: string | null;
  primary_color: string;
  button_text_color: string | null;
  theme: "light" | "dark";
  logo_size: "small" | "medium" | "large";
  font_family: "default" | "poppins" | "playfair" | "bebas" | "caveat" | "oswald" | "merriweather";
  background_image_url: string | null;
  background_darken: boolean;
  show_business_hours: boolean;
  business_hours: BusinessHourEntry[];
  highlight_cards: HighlightCard[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  notification_webhook_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessHourEntry = {
  day: number; // 0 = domingo ... 6 = sábado
  closed: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
};

export type HighlightCard = {
  title: string;
  subtitle: string;
};

export type ButtonConfig = {
  message?: string; // whatsapp initial message
  pix_key?: string;
  pix_key_type?: "cpf" | "cnpj" | "email" | "phone" | "random";
  pix_merchant_city?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  full_address?: string;
  address_lat?: number;
  address_lng?: number;
  address_block_bg?: string;
  address_block_text?: string;
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
  name: string;
  enabled: boolean;
  layout: "stacked" | "carousel" | "grid";
  interval_seconds: number;
  position: number;
};

export type CatalogItem = {
  id: string;
  group_id: string;
  media_type: "image" | "video";
  media_url: string | null;
  poster_url: string | null;
  item_type: "product" | "service";
  aspect: "square" | "horizontal" | "vertical" | "original";
  object_fit: "cover" | "contain";
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
