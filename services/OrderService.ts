import { createClient } from '@/lib/supabase/server';
import { Order, OrderItem } from '@/models';

export class OrderService {
  private supabase = createClient();

  async createOrder(orderData: {
    customer_name: string;
    items: OrderItem[];
    total_amount: number;
    table_number?: string;
  }): Promise<Order> {
    const { data, error } = await this.supabase
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        items: JSON.stringify(orderData.items),
        total_amount: orderData.total_amount,
        status: 'received',
        table_number: orderData.table_number || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create order: ${error.message}`);

    return {
      ...data,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    };
  }

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch orders: ${error.message}`);

    return (data || []).map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));
  }

  async getOrdersByDate(date: Date): Promise<Order[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch orders: ${error.message}`);

    return (data || []).map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));
  }

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
    if (!data) return null;

    return {
      ...data,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    };
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    const { data, error } = await this.supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update order: ${error.message}`);

    return {
      ...data,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    };
  }

  async deleteOrder(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete order: ${error.message}`);
  }

  async getOrderHistory(customerName?: string): Promise<Order[]> {
    let query = this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerName) {
      query = query.ilike('customer_name', `%${customerName}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch order history: ${error.message}`);

    return (data || []).map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));
  }
}

