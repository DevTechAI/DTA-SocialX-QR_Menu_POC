import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/AuthService';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const authService = new AuthService();
    const user = await authService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

