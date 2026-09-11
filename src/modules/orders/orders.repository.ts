import { supabase } from '../../database/supabase';
import type {
  Address,
  Order,
  OrderItem,
  OrderItemAddon,
  OrderStatus,
  OrderStatusHistory,
  Payment,
  Profile,
} from '../../database/types';

export class OrdersRepository {
  async findOrCreateCustomer(data: {
    id?: string;
    full_name: string;
    phone: string;
  }): Promise<Profile> {
    if (data.id) {
      const { data: existingById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.id)
        .maybeSingle();

      if (existingById) {
        return existingById as unknown as Profile;
      }
    }

    // Procura pelo telefone
    const { data: existingByPhone } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', data.phone.trim())
      .maybeSingle();

    if (existingByPhone) {
      return existingByPhone as unknown as Profile;
    }

    // Cria novo cliente
    const { data: created, error } = await (supabase.from('profiles') as any)
      .insert({
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        role: 'CUSTOMER',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return created as unknown as Profile;
  }

  async createAddress(addressData: {
    user_id?: string | null;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip_code?: string | null;
    reference_point?: string | null;
    is_default?: boolean;
  }): Promise<Address> {
    const { data, error } = await (supabase.from('addresses') as any)
      .insert({
        user_id: addressData.user_id || null,
        street: addressData.street.trim(),
        number: addressData.number.trim(),
        complement: addressData.complement?.trim() || null,
        neighborhood: addressData.neighborhood.trim(),
        city: addressData.city.trim(),
        state: addressData.state.trim(),
        zip_code: addressData.zip_code?.trim() || null,
        reference_point: addressData.reference_point?.trim() || null,
        is_default: addressData.is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as Address;
  }

  async getAddressById(id: string): Promise<Address | null> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as Address) || null;
  }

  async createOrder(orderData: {
    customer_id: string;
    delivery_type: Order['delivery_type'];
    address_id: string | null;
    takeout_time: string | null;
    status: OrderStatus;
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total_amount: number;
    payment_method: Order['payment_method'];
    need_change: boolean;
    change_for: number | null;
    notes: string | null;
  }): Promise<Order> {
    const { data, error } = await (supabase.from('orders') as any)
      .insert(orderData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as Order;
  }

  async createOrderItems(
    items: Array<{
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
    }>
  ): Promise<OrderItem[]> {
    const { data, error } = await (supabase.from('order_items') as any)
      .insert(items)
      .select();

    if (error) {
      throw error;
    }

    return (data as unknown as OrderItem[]) || [];
  }

  async createOrderItemAddons(
    addons: Array<{
      order_item_id: string;
      addon_id: string;
      addon_name: string;
      price: number;
    }>
  ): Promise<OrderItemAddon[]> {
    if (addons.length === 0) return [];

    const { data, error } = await (supabase.from('order_item_addons') as any)
      .insert(addons)
      .select();

    if (error) {
      throw error;
    }

    return (data as unknown as OrderItemAddon[]) || [];
  }

  async createOrderStatusHistory(data: {
    order_id: string;
    from_status: string | null;
    to_status: string;
    notes: string | null;
  }): Promise<OrderStatusHistory> {
    const { data: created, error } = await (supabase.from('order_status_history') as any)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return created as unknown as OrderStatusHistory;
  }

  async findOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as Order) || null;
  }

  async getOrderCompleteDetails(id: string) {
    const [orderRes, itemsRes, historyRes, paymentRes] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true }),
      supabase.from('payments').select('*').eq('order_id', id).maybeSingle(),
    ]);

    if (orderRes.error) throw orderRes.error;
    if (!orderRes.data) return null;

    const order = orderRes.data as unknown as Order;
    const items = (itemsRes.data as unknown as OrderItem[]) || [];
    const history = (historyRes.data as unknown as OrderStatusHistory[]) || [];
    const payment = (paymentRes.data as unknown as Payment | null) || null;

    // Busca adicionais dos itens
    const itemIds = items.map((i) => i.id);
    let addons: OrderItemAddon[] = [];
    if (itemIds.length > 0) {
      const { data: addonsData } = await supabase
        .from('order_item_addons')
        .select('*')
        .in('order_item_id', itemIds);
      addons = (addonsData as unknown as OrderItemAddon[]) || [];
    }

    // Busca cliente
    let customer: Profile | null = null;
    if (order.customer_id) {
      const { data: customerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.customer_id)
        .maybeSingle();
      customer = (customerData as unknown as Profile) || null;
    }

    // Busca endereço
    let address: Address | null = null;
    if (order.address_id) {
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', order.address_id)
        .maybeSingle();
      address = (addressData as unknown as Address) || null;
    }

    const itemsWithAddons = items.map((item) => ({
      ...item,
      addons: addons.filter((a) => a.order_item_id === item.id),
    }));

    return {
      order,
      customer,
      address,
      items: itemsWithAddons,
      status_history: history,
      payment,
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await (supabase.from('orders') as any)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as Order;
  }
}
