import { createClient } from '@/lib/supabase/server';
import { Order, OrderItem } from '@/models';

export class OrderService {
  private supabase = createClient();

  async createOrder(orderData: {
    customer_name: string;
    customer_phNo: string;
    items: OrderItem[];
    total_amount: number;
    table_number?: string;
  }): Promise<Order> {
    // First, ensure customer exists in customer_allorders_details table
    // The trigger will handle updating this record when the order is created
    const { data: existingCustomer } = await this.supabase
      .from('customer_allorders_details')
      .select('customer_phno')
      .eq('customer_phno', orderData.customer_phNo)
      .single();

    // Only insert if customer doesn't exist
    if (!existingCustomer) {
      const { error: customerError } = await this.supabase
        .from('customer_allorders_details')
        .insert({
          customer_phno: orderData.customer_phNo,
          customer_name: orderData.customer_name,
          total_ordered_value_at_socialx: 0,
          order_history_json: [],
          latestdate_allorder_json: {},
          latestdate_allorder_value: 0,
          latestdate_allorder_status: 'UNPAID',
        });

      if (customerError) {
        console.error('❌ Error creating customer:', customerError);
        // Don't throw - let the trigger handle it, but log the error
      }
    }

    const { data, error } = await this.supabase
      .from('orders')
      .insert({
        customer_name: orderData.customer_name,
        customer_phno: orderData.customer_phNo,
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

    // Ensure customer_phno is properly mapped (handle both cases)
    const phoneNumber = data.customer_phno || data.customer_phNo || 'N/A';
    return {
      ...data,
      customer_phno: phoneNumber, // Always use lowercase to match interface
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
    };
  }

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching orders:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} orders from Supabase`);
    return (data || []).map(order => {
      // Ensure customer_phno is properly mapped (handle both cases)
      const phoneNumber = order.customer_phno || order.customer_phNo || 'N/A';
      return {
        ...order,
        customer_phno: phoneNumber, // Always use lowercase to match interface
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      };
    });
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

    return (data || []).map(order => {
      // Ensure customer_phno is properly mapped (handle both cases)
      const phoneNumber = order.customer_phno || order.customer_phNo || 'N/A';
      return {
        ...order,
        customer_phno: phoneNumber, // Always use lowercase to match interface
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      };
    });
  }

  async getOrdersByBusinessDay(date: Date = new Date()): Promise<Order[]> {
    // IST is UTC+5:30
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    
    // Get current UTC time
    const nowUTC = new Date(date);
    
    // Convert to IST by adding offset
    const nowIST = new Date(nowUTC.getTime() + IST_OFFSET_MS);
    
    // Get IST date components
    const istYear = nowIST.getUTCFullYear();
    const istMonth = nowIST.getUTCMonth();
    const istDate = nowIST.getUTCDate();
    const istHours = nowIST.getUTCHours();
    
    // Calculate 8 AM IST today in UTC (8 AM IST = 2:30 AM UTC)
    const startOfBusinessDayUTC = new Date(Date.UTC(istYear, istMonth, istDate, 2, 30, 0, 0));
    
    // Calculate 8 AM IST tomorrow in UTC
    const endOfBusinessDayUTC = new Date(Date.UTC(istYear, istMonth, istDate + 1, 2, 30, 0, 0));
    
    // If current time is before 8 AM IST, use yesterday's 8 AM IST to today's 8 AM IST
    if (istHours < 8) {
      const yesterdayIST = new Date(Date.UTC(istYear, istMonth, istDate - 1, 2, 30, 0, 0));
      startOfBusinessDayUTC.setTime(yesterdayIST.getTime());
      endOfBusinessDayUTC.setTime(startOfBusinessDayUTC.getTime() + (24 * 60 * 60 * 1000));
    }

    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfBusinessDayUTC.toISOString())
      .lt('created_at', endOfBusinessDayUTC.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching business day orders:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} orders for business day (8 AM IST to 8 AM IST)`);
    console.log(`   Business day window: ${startOfBusinessDayUTC.toISOString()} to ${endOfBusinessDayUTC.toISOString()}`);
    return (data || []).map(order => {
      // Ensure customer_phno is properly mapped (handle both cases)
      const phoneNumber = order.customer_phno || order.customer_phNo || 'N/A';
      return {
        ...order,
        customer_phno: phoneNumber, // Always use lowercase to match interface
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      };
    });
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

    // Ensure customer_phno is properly mapped (handle both cases)
    const phoneNumber = data.customer_phno || data.customer_phNo || 'N/A';
    return {
      ...data,
      customer_phno: phoneNumber, // Always use lowercase to match interface
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

  async deleteAllOrders(): Promise<void> {
    // Delete all orders by selecting all IDs first, then deleting them
    const { data: allOrders, error: fetchError } = await this.supabase
      .from('orders')
      .select('id');

    if (fetchError) throw new Error(`Failed to fetch orders: ${fetchError.message}`);

    if (allOrders && allOrders.length > 0) {
      const ids = allOrders.map(order => order.id);
      const { error } = await this.supabase
        .from('orders')
        .delete()
        .in('id', ids);

      if (error) throw new Error(`Failed to delete all orders: ${error.message}`);
    }
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

    return (data || []).map(order => {
      // Ensure customer_phno is properly mapped (handle both cases)
      const phoneNumber = order.customer_phno || order.customer_phNo || 'N/A';
      return {
        ...order,
        customer_phno: phoneNumber, // Always use lowercase to match interface
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      };
    });
  }
}

