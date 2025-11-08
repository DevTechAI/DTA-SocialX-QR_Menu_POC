import { createClient } from '@/lib/supabase/server';
import { MenuItem } from '@/models';

export class MenuService {
  private supabase = createClient();

  async getAllMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true });

    if (error) throw new Error(`Failed to fetch menu: ${error.message}`);
    return data || [];
  }

  async getAllMenuItemsForAdmin(): Promise<MenuItem[]> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch menu: ${error.message}`);
    return data || [];
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('category', category)
      .eq('available', true)
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch menu items: ${error.message}`);
    return data || [];
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch menu item: ${error.message}`);
    }
    return data;
  }

  async createMenuItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .insert({
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create menu item: ${error.message}`);
    return data;
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await this.supabase
      .from('menu_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update menu item: ${error.message}`);
    return data;
  }

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete menu item: ${error.message}`);
  }

  async toggleAvailability(id: string, available: boolean): Promise<MenuItem> {
    return this.updateMenuItem(id, { available });
  }
}

