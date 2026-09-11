import { OrdersRepository } from './orders.repository';
import { MenuRepository } from '../menu/menu.repository';
import { DeliveryZoneRepository } from '../delivery-zones/delivery-zone.repository';
import { SettingsRepository } from '../settings/settings.repository';
import { PaymentsRepository } from '../payments/payments.repository';
import type { CreateOrderInput } from './orders.schema';
import type { OrderStatus } from '../../database/types';
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error';
import { generatePixCopiaECola } from '../../shared/utils/pix';

export class OrdersService {
  constructor(
    private readonly ordersRepository = new OrdersRepository(),
    private readonly menuRepository = new MenuRepository(),
    private readonly deliveryZoneRepository = new DeliveryZoneRepository(),
    private readonly settingsRepository = new SettingsRepository(),
    private readonly paymentsRepository = new PaymentsRepository()
  ) {}

  async createOrder(input: CreateOrderInput) {
    // 1. Identifica ou cria o perfil do cliente
    const customer = await this.ordersRepository.findOrCreateCustomer({
      id: input.customer.id,
      full_name: input.customer.full_name,
      phone: input.customer.phone,
    });

    // 2. Valida e resolve endereço e taxa de entrega
    let addressId: string | null = null;
    let deliveryFee = 0;

    if (input.delivery_type === 'DELIVERY') {
      let neighborhood = '';

      if (input.address_id) {
        const existingAddress = await this.ordersRepository.getAddressById(input.address_id);
        if (!existingAddress) {
          throw new NotFoundError('Endereço informado não encontrado.');
        }
        addressId = existingAddress.id;
        neighborhood = existingAddress.neighborhood;
      } else if (input.address) {
        const createdAddress = await this.ordersRepository.createAddress({
          user_id: customer.id,
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement,
          neighborhood: input.address.neighborhood,
          city: input.address.city,
          state: input.address.state,
          zip_code: input.address.zip_code,
          reference_point: input.address.reference_point,
        });
        addressId = createdAddress.id;
        neighborhood = createdAddress.neighborhood;
      }

      // Validação estrita do frete por bairro
      const zone = await this.deliveryZoneRepository.findByNeighborhood(neighborhood);
      if (!zone) {
        throw new BadRequestError(
          `Infelizmente não realizamos entregas no bairro "${neighborhood}". Por favor, selecione a opção de Retirada (TAKEOUT).`
        );
      }
      deliveryFee = Number(zone.delivery_fee);
    }

    // 3. Validação estrita dos itens e adicionais no servidor
    const menuItemIds = Array.from(new Set(input.items.map((i) => i.menu_item_id)));
    const allAddonIds = Array.from(
      new Set(input.items.flatMap((i) => i.addon_ids || []))
    );

    const [dbMenuItems, dbAddons] = await Promise.all([
      this.menuRepository.findItemsByIds(menuItemIds),
      this.menuRepository.findAddonsByIds(allAddonIds),
    ]);

    const menuItemsMap = new Map(dbMenuItems.map((item) => [item.id, item]));
    const addonsMap = new Map(dbAddons.map((addon) => [addon.id, addon]));

    // Valida se todos os pratos existem e estão disponíveis
    for (const itemId of menuItemIds) {
      const item = menuItemsMap.get(itemId);
      if (!item) {
        throw new BadRequestError(`Item do cardápio não encontrado: ${itemId}`);
      }
      if (!item.is_available) {
        throw new BadRequestError(`O item "${item.name}" está temporariamente esgotado.`);
      }
    }

    // Valida se todos os adicionais existem e estão disponíveis
    for (const addonId of allAddonIds) {
      const addon = addonsMap.get(addonId);
      if (!addon) {
        throw new BadRequestError(`Adicional não encontrado: ${addonId}`);
      }
      if (!addon.is_available) {
        throw new BadRequestError(`O adicional "${addon.name}" está indisponível.`);
      }
    }

    // 4. Cálculo do Subtotal estritamente pelo servidor
    let subtotal = 0;
    const preparedItems = input.items.map((reqItem) => {
      const dbItem = menuItemsMap.get(reqItem.menu_item_id)!;
      const unitPrice = Number(dbItem.price);

      const itemAddons = (reqItem.addon_ids || []).map((addonId) => {
        const dbAddon = addonsMap.get(addonId)!;
        return {
          addon_id: dbAddon.id,
          addon_name: dbAddon.name,
          price: Number(dbAddon.price),
        };
      });

      const addonsTotalPerUnit = itemAddons.reduce((acc, curr) => acc + curr.price, 0);
      const itemTotalPrice = Number(
        ((unitPrice + addonsTotalPerUnit) * reqItem.quantity).toFixed(2)
      );

      subtotal += itemTotalPrice;

      return {
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        option_label: dbItem.option_label,
        day_name: dbItem.day_of_week,
        has_salad: reqItem.has_salad,
        quantity: reqItem.quantity,
        unit_price: unitPrice,
        preferences: reqItem.preferences?.trim() || null,
        total_price: itemTotalPrice,
        addons: itemAddons,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    deliveryFee = Number(deliveryFee.toFixed(2));
    const discount = 0;
    const totalAmount = Number((subtotal + deliveryFee - discount).toFixed(2));

    // Validação de troco
    if (input.payment_method === 'CASH_ON_DELIVERY' && input.need_change) {
      if (!input.change_for || input.change_for < totalAmount) {
        throw new BadRequestError(
          `O valor para troco (R$ ${input.change_for?.toFixed(2)}) deve ser maior que o total do pedido (R$ ${totalAmount.toFixed(2)}).`
        );
      }
    }

    // 5. Salva o Pedido na tabela 'orders'
    const order = await this.ordersRepository.createOrder({
      customer_id: customer.id,
      delivery_type: input.delivery_type,
      address_id: addressId,
      takeout_time: input.delivery_type === 'TAKEOUT' ? input.takeout_time || null : null,
      status: 'PENDING',
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total_amount: totalAmount,
      payment_method: input.payment_method,
      need_change: input.need_change,
      change_for: input.change_for ? Number(input.change_for) : null,
      notes: input.notes?.trim() || null,
    });

    // 6. Insere os itens do pedido
    const itemsToInsert = preparedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      option_label: item.option_label,
      day_name: item.day_name,
      has_salad: item.has_salad,
      quantity: item.quantity,
      unit_price: item.unit_price,
      preferences: item.preferences,
      total_price: item.total_price,
    }));

    const insertedItems = await this.ordersRepository.createOrderItems(itemsToInsert);

    // 7. Insere os adicionais para cada item criado
    const addonsToInsert: Array<{
      order_item_id: string;
      addon_id: string;
      addon_name: string;
      price: number;
    }> = [];

    insertedItems.forEach((insertedItem, index) => {
      const originalItem = preparedItems[index];
      if (originalItem && originalItem.addons.length > 0) {
        originalItem.addons.forEach((addon) => {
          addonsToInsert.push({
            order_item_id: insertedItem.id,
            addon_id: addon.addon_id,
            addon_name: addon.addon_name,
            price: addon.price,
          });
        });
      }
    });

    if (addonsToInsert.length > 0) {
      await this.ordersRepository.createOrderItemAddons(addonsToInsert);
    }

    // 8. Registra o histórico inicial de status
    await this.ordersRepository.createOrderStatusHistory({
      order_id: order.id,
      from_status: null,
      to_status: 'PENDING',
      notes: 'Pedido criado com sucesso pelo cliente',
    });

    // 9. Se for pagamento via PIX, gera os dados de Pix Copia e Cola
    let pixPayment = null;
    if (input.payment_method === 'PIX') {
      const settings = await this.settingsRepository.getSettings();
      const pixKey = settings?.pix_key || 'contato@marmitariadodia.com.br';
      const merchantName = settings?.name || 'Marmitaria do Dia';
      const txId = `PEDIDO${order.order_number}`;

      const qrCodePix = generatePixCopiaECola({
        pixKey,
        merchantName,
        merchantCity: 'SAO PAULO',
        amount: totalAmount,
        txId,
        description: `Marmitaria Pedido #${order.order_number}`,
      });

      const paymentRecord = await this.paymentsRepository.createPayment({
        order_id: order.id,
        provider: 'PIX_BACEN',
        external_id: txId,
        status: 'PENDING',
        qr_code_pix: qrCodePix,
      });

      pixPayment = {
        id: paymentRecord.id,
        status: paymentRecord.status,
        provider: paymentRecord.provider,
        qr_code_pix: qrCodePix,
        pix_key: pixKey,
        tx_id: txId,
      };
    }

    return {
      id: order.id,
      order_number: order.order_number,
      order_number_formatted: `#${order.order_number}`,
      status: order.status,
      delivery_type: order.delivery_type,
      payment_method: order.payment_method,
      subtotal: Number(order.subtotal),
      delivery_fee: Number(order.delivery_fee),
      discount: Number(order.discount),
      total_amount: Number(order.total_amount),
      customer: {
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone,
      },
      payment: pixPayment,
    };
  }

  async getOrderById(id: string) {
    const orderDetails = await this.ordersRepository.getOrderCompleteDetails(id);
    if (!orderDetails) {
      throw new NotFoundError(`Pedido com ID "${id}" não encontrado.`);
    }

    return {
      id: orderDetails.order.id,
      order_number: orderDetails.order.order_number,
      order_number_formatted: `#${orderDetails.order.order_number}`,
      status: orderDetails.order.status,
      delivery_type: orderDetails.order.delivery_type,
      takeout_time: orderDetails.order.takeout_time,
      payment_method: orderDetails.order.payment_method,
      need_change: orderDetails.order.need_change,
      change_for: orderDetails.order.change_for ? Number(orderDetails.order.change_for) : null,
      notes: orderDetails.order.notes,
      subtotal: Number(orderDetails.order.subtotal),
      delivery_fee: Number(orderDetails.order.delivery_fee),
      discount: Number(orderDetails.order.discount),
      total_amount: Number(orderDetails.order.total_amount),
      created_at: orderDetails.order.created_at,
      updated_at: orderDetails.order.updated_at,
      customer: orderDetails.customer
        ? {
            id: orderDetails.customer.id,
            full_name: orderDetails.customer.full_name,
            phone: orderDetails.customer.phone,
          }
        : null,
      address: orderDetails.address
        ? {
            id: orderDetails.address.id,
            street: orderDetails.address.street,
            number: orderDetails.address.number,
            complement: orderDetails.address.complement,
            neighborhood: orderDetails.address.neighborhood,
            city: orderDetails.address.city,
            state: orderDetails.address.state,
            zip_code: orderDetails.address.zip_code,
            reference_point: orderDetails.address.reference_point,
          }
        : null,
      items: orderDetails.items.map((item) => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        option_label: item.option_label,
        day_name: item.day_name,
        has_salad: item.has_salad,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        preferences: item.preferences,
        total_price: Number(item.total_price),
        addons: item.addons.map((a) => ({
          id: a.addon_id,
          name: a.addon_name,
          price: Number(a.price),
        })),
      })),
      payment: orderDetails.payment
        ? {
            id: orderDetails.payment.id,
            provider: orderDetails.payment.provider,
            status: orderDetails.payment.status,
            qr_code_pix: orderDetails.payment.qr_code_pix,
            paid_at: orderDetails.payment.paid_at,
          }
        : null,
      status_history: orderDetails.status_history.map((h) => ({
        id: h.id,
        from_status: h.from_status,
        to_status: h.to_status,
        notes: h.notes,
        created_at: h.created_at,
      })),
    };
  }

  async updateOrderStatus(id: string, newStatus: OrderStatus, notes?: string) {
    const existingOrder = await this.ordersRepository.findOrderById(id);
    if (!existingOrder) {
      throw new NotFoundError(`Pedido com ID "${id}" não encontrado.`);
    }

    const previousStatus = existingOrder.status;

    // Atualiza status do pedido
    const updatedOrder = await this.ordersRepository.updateOrderStatus(id, newStatus);

    // Registra histórico
    await this.ordersRepository.createOrderStatusHistory({
      order_id: id,
      from_status: previousStatus,
      to_status: newStatus,
      notes: notes || `Status alterado para ${newStatus} pelo painel da cozinha`,
    });

    return {
      id: updatedOrder.id,
      order_number: updatedOrder.order_number,
      order_number_formatted: `#${updatedOrder.order_number}`,
      previous_status: previousStatus,
      current_status: updatedOrder.status,
      updated_at: updatedOrder.updated_at,
    };
  }
}
