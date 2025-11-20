import { NextRequest, NextResponse } from 'next/server';
import { MenuService } from '@/services/MenuService';
import { AuthService } from '@/services/AuthService';
import { menuItems } from '@/lib/data/menu-items';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Use mock data if Supabase not configured
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      console.log('📋 Using mock menu data (Supabase not configured)');
      return NextResponse.json(menuItems);
    }

    const menuService = new MenuService();
    const items = await menuService.getAllMenuItemsForAdmin();
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    // Fallback to mock data
    return NextResponse.json(menuItems);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Supabase not configured. Cannot create menu items.' },
        { status: 503 }
      );
    }

    const authService = new AuthService();
    await authService.requireRole('manager');

    const body = await request.json();
    const menuService = new MenuService();
    const item = await menuService.createMenuItem(body);

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

