export type MenuCategory = 'PRATO_DO_DIA' | 'BEBIDA';

export type DayOfWeek =
  | 'SEGUNDA'
  | 'TERCA'
  | 'QUARTA'
  | 'QUINTA'
  | 'SEXTA'
  | 'SABADO'
  | 'TODOS_OS_DIAS'
  | 'DOMINGO';

export type DeliveryType = 'DELIVERY' | 'TAKEOUT';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELED';

export type PaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'CASH_ON_DELIVERY'
  | 'CARD_ON_DELIVERY';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  id: string;
  user_id: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string | null;
  reference_point: string | null;
  is_default: boolean;
  created_at?: string;
}

export interface DeliveryZone {
  id: string;
  neighborhood: string;
  delivery_fee: number;
  estimated_time_min: number | null;
  is_active: boolean;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  category: MenuCategory;
  day_of_week: DayOfWeek;
  option_label: string | null; // e.g. '1ª Opção', '2ª Opção', etc.
  name: string;
  ingredients: string | null;
  has_salad: boolean;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  display_order: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  delivery_type: DeliveryType;
  address_id: string | null;
  takeout_time: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  need_change: boolean;
  change_for: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  option_label: string | null;
  day_name: string | null;
  has_salad: boolean;
  quantity: number;
  unit_price: number;
  preferences: string | null;
  total_price: number;
  created_at?: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_id: string;
  addon_name: string;
  price: number;
  created_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  notes: string | null;
  created_at?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  external_id: string | null;
  status: PaymentStatus;
  qr_code_pix: string | null;
  paid_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RestaurantSettings {
  id: number;
  name: string;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  phone_whatsapp: string;
  pix_key: string;
  address_text: string;
  takeout_open_time: string | null;
  updated_at?: string;
}

// Database schema definition for Supabase Generic Client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'full_name' | 'phone'>;
        Update: Partial<Profile>;
      };
      addresses: {
        Row: Address;
        Insert: Partial<Address> & Pick<Address, 'street' | 'number' | 'neighborhood' | 'city' | 'state'>;
        Update: Partial<Address>;
      };
      delivery_zones: {
        Row: DeliveryZone;
        Insert: Partial<DeliveryZone> & Pick<DeliveryZone, 'neighborhood' | 'delivery_fee'>;
        Update: Partial<DeliveryZone>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Partial<MenuItem> & Pick<MenuItem, 'category' | 'day_of_week' | 'name' | 'price'>;
        Update: Partial<MenuItem>;
      };
      menu_addons: {
        Row: MenuAddon;
        Insert: Partial<MenuAddon> & Pick<MenuAddon, 'name' | 'price'>;
        Update: Partial<MenuAddon>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & Pick<Order, 'delivery_type' | 'status' | 'subtotal' | 'delivery_fee' | 'total_amount' | 'payment_method'>;
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & Pick<OrderItem, 'order_id' | 'menu_item_id' | 'item_name' | 'quantity' | 'unit_price' | 'total_price'>;
        Update: Partial<OrderItem>;
      };
      order_item_addons: {
        Row: OrderItemAddon;
        Insert: Partial<OrderItemAddon> & Pick<OrderItemAddon, 'order_item_id' | 'addon_id' | 'addon_name' | 'price'>;
        Update: Partial<OrderItemAddon>;
      };
      order_status_history: {
        Row: OrderStatusHistory;
        Insert: Partial<OrderStatusHistory> & Pick<OrderStatusHistory, 'order_id' | 'to_status'>;
        Update: Partial<OrderStatusHistory>;
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & Pick<Payment, 'order_id' | 'provider' | 'status'>;
        Update: Partial<Payment>;
      };
      restaurant_settings: {
        Row: RestaurantSettings;
        Insert: Partial<RestaurantSettings> & Pick<RestaurantSettings, 'name' | 'is_open' | 'opening_time' | 'closing_time'>;
        Update: Partial<RestaurantSettings>;
      };
    };
  };
}
