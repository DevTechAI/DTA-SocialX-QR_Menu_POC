import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/services/AuthService';

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Supabase not configured. Cannot upload images.' },
        { status: 503 }
      );
    }

    const authService = new AuthService();
    await authService.requireRole('manager');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const menuItemId = formData.get('menuItemId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = menuItemId 
      ? `${menuItemId}-${Date.now()}.${fileExt}`
      : `menu-item-${Date.now()}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

