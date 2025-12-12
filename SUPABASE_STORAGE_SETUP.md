# Supabase Storage Setup for Menu Item Images

## Overview
This guide explains how to set up Supabase Storage to enable image uploads for menu items in the admin dashboard.

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `menu-images`
   - **Public bucket**: ✅ **Enable** (check this box)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp,image/gif`
5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies.

### Option A: Using SQL Script (Recommended - Fastest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Open the file `supabase/storage-policies.sql` from this project
5. Copy and paste the entire contents into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

This will create all 4 policies automatically:
- ✅ Public can view menu images (SELECT)
- ✅ Managers can upload menu images (INSERT)
- ✅ Managers can update menu images (UPDATE)
- ✅ Managers can delete menu images (DELETE)

### Option B: Using Storage UI (Manual)

1. Go to **Storage** → **Policies** (or click on the `menu-images` bucket → **Policies** tab)
2. Click **"New Policy"** or **"Add Policy"**

#### Policy 1: Allow Public Read Access
- **Policy name**: `Public can view menu images`
- **Allowed operation**: `SELECT` (Read)
- **Policy definition**:
  ```sql
  bucket_id = 'menu-images'
  ```
- **Description**: Allows anyone to view menu item images

#### Policy 2: Allow Authenticated Managers to Upload
- **Policy name**: `Managers can upload menu images`
- **Allowed operation**: `INSERT` (Upload)
- **Policy definition**:
  ```sql
  bucket_id = 'menu-images' AND auth.role() = 'authenticated'
  ```
- **Description**: Allows authenticated managers to upload images

#### Policy 3: Allow Authenticated Managers to Update
- **Policy name**: `Managers can update menu images`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'menu-images' AND auth.role() = 'authenticated'
  ```
- **Description**: Allows authenticated managers to update/replace images

#### Policy 4: Allow Authenticated Managers to Delete
- **Policy name**: `Managers can delete menu images`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'menu-images' AND auth.role() = 'authenticated'
  ```
- **Description**: Allows authenticated managers to delete images

## Step 3: Verify Setup

1. Go to **Storage** → **menu-images**
2. You should see an empty bucket (or any test files you've uploaded)
3. Try uploading a test image manually to verify permissions

## Step 4: Test Image Upload in Admin Dashboard

1. Navigate to `http://localhost:3000/order-admin/menu-edit`
2. Click **"Edit"** on any menu item
3. Click **"Upload Image"** and select an image file
4. The image should upload and display a preview
5. Click **"Update"** to save the menu item with the image URL

## Troubleshooting

### Error: "Failed to upload image: new row violates row-level security policy"
- **Solution**: Make sure you've created the storage policies as described in Step 2
- Verify that the bucket is set to **Public**

### Error: "Bucket not found"
- **Solution**: Ensure the bucket name is exactly `menu-images` (case-sensitive)
- Check that the bucket exists in your Supabase Storage dashboard

### Images not displaying
- **Solution**: 
  1. Check that the bucket is set to **Public**
  2. Verify the image URL in the database (`menu_items.image_url` column)
  3. Check browser console for CORS or loading errors

### Upload fails with "Unauthorized"
- **Solution**: 
  1. Make sure you're logged in as a manager
  2. Verify your authentication session is valid
  3. Check that the storage policies allow INSERT operations for authenticated users

## File Naming Convention

Images are automatically named using the following pattern:
- Format: `{menu-item-id}-{timestamp}.{extension}`
- Example: `hot-latte-1703123456789.jpg`
- Location: `menu-items/` folder within the bucket

## Image Specifications

- **Max file size**: 5 MB
- **Supported formats**: JPEG, JPG, PNG, WebP, GIF
- **Recommended dimensions**: 800x600px or similar aspect ratio
- **Recommended format**: JPEG or WebP for best compression

## Notes

- Images are stored permanently in Supabase Storage
- When updating a menu item image, the old image is replaced (upsert: true)
- To delete an image, remove it from the menu item (set `image_url` to null) and optionally delete it from Storage manually
- Public bucket means images are accessible via public URLs without authentication

