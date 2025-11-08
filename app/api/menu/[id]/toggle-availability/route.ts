import { NextRequest, NextResponse } from 'next/server';
import { MenuService } from '@/services/MenuService';
import { AuthService } from '@/services/AuthService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Supabase not configured. Cannot toggle availability.' },
        { status: 503 }
      );
    }

    const authService = new AuthService();
    await authService.requireRole('manager');

    const { available } = await request.json();
    const menuService = new MenuService();
    const item = await menuService.toggleAvailability(params.id, available);

    return NextResponse.json(item);
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to toggle availability' },
      { status: 500 }
    );
  }
}

