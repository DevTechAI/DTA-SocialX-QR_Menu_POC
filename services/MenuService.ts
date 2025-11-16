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

    if (error) {
      console.error('❌ Supabase error fetching menu items:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      throw new Error(`Failed to fetch menu: ${error.message}`);
    }
    console.log(`✅ Fetched ${data?.length || 0} menu items from Supabase`);
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
    console.log(`📝 Updating menu item (ID: ${id}) with:`, updates);
    const { data, error } = await this.supabase
      .from('menu_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ Database update failed for item ID ${id}:`, error);
      throw new Error(`Failed to update menu item: ${error.message}`);
    }
    
    console.log(`✅ Database updated successfully for item ID ${id}. New values:`, {
      id: data.id,
      name: data.name,
      available: data.available,
      updated_at: data.updated_at
    });
    return data;
  }

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete menu item: ${error.message}`);
  }

  async toggleAvailability(id: string, available: boolean, name?: string): Promise<MenuItem> {
    // If name is provided, validate it matches the item
    if (name) {
      const item = await this.getMenuItemById(id);
      if (!item) {
        throw new Error(`Menu item with id ${id} not found`);
      }
      if (item.name !== name) {
        throw new Error(`Name mismatch: expected "${item.name}", got "${name}"`);
      }
      console.log(`🔄 Toggling availability for "${name}" (ID: ${id}) to ${available ? 'available' : 'unavailable'}`);
    } else {
      console.log(`🔄 Toggling availability for item ID: ${id} to ${available ? 'available' : 'unavailable'}`);
    }
    
    const updatedItem = await this.updateMenuItem(id, { available });
    console.log(`✅ Successfully updated "${updatedItem.name}" availability to ${available ? 'available' : 'unavailable'}`);
    return updatedItem;
  }

  /**
   * Check availability of multiple menu items by their IDs
   * Returns a map of item ID to availability status
   */
  async checkItemsAvailability(itemIds: string[]): Promise<Record<string, boolean>> {
    if (itemIds.length === 0) {
      return {};
    }

    const { data, error } = await this.supabase
      .from('menu_items')
      .select('id, available')
      .in('id', itemIds);

    if (error) {
      console.error('❌ Error checking items availability:', error);
      throw new Error(`Failed to check items availability: ${error.message}`);
    }

    const availabilityMap: Record<string, boolean> = {};
    (data || []).forEach(item => {
      availabilityMap[item.id] = item.available === true;
    });

    // For items not found in database, mark as unavailable
    itemIds.forEach(id => {
      if (!(id in availabilityMap)) {
        availabilityMap[id] = false;
        console.warn(`⚠️ Item ID ${id} not found in database, marking as unavailable`);
      }
    });

    return availabilityMap;
  }
}

