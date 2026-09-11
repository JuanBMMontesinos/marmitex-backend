import { supabase } from '../../database/supabase';
import type { Payment, PaymentStatus } from '../../database/types';

export class PaymentsRepository {
  async createPayment(data: {
    order_id: string;
    provider: string;
    external_id?: string | null;
    status: PaymentStatus;
    qr_code_pix?: string | null;
  }): Promise<Payment> {
    const { data: created, error } = await (supabase.from('payments') as any)
      .insert({
        order_id: data.order_id,
        provider: data.provider,
        external_id: data.external_id || null,
        status: data.status,
        qr_code_pix: data.qr_code_pix || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return created as unknown as Payment;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as Payment) || null;
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', externalId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as Payment) || null;
  }

  async markAsPaid(paymentId: string): Promise<Payment> {
    const { data, error } = await (supabase.from('payments') as any)
      .update({
        status: 'PAID',
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as Payment;
  }
}
