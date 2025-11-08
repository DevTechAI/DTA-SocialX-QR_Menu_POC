# Google OAuth Setup (Optional)

The 400 Bad Request error occurs because Google OAuth is not configured in your Supabase project. This is **optional** - you can use email/password authentication instead.

## Option 1: Use Email/Password (Recommended for Now)

You can simply use the email/password sign-in form. No additional setup needed!

## Option 2: Enable Google OAuth (Optional)

If you want to enable Google sign-in, follow these steps:

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
   - Replace `YOUR_PROJECT_ID` with your Supabase project ID
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** (left sidebar)
3. Find **Google** in the list
4. Toggle it **ON**
5. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**

### Step 3: Add Redirect URL

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

### Step 4: Test

1. Restart your Next.js dev server
2. Visit `/auth/signin`
3. Click "Sign in with Google"
4. Should redirect to Google sign-in page

## Troubleshooting

### "400 Bad Request" Error
- **Cause**: Google OAuth not configured in Supabase
- **Solution**: Follow Step 2 above, or use email/password sign-in

### "Redirect URI mismatch" Error
- **Cause**: Redirect URL not whitelisted
- **Solution**: Add the redirect URL in both Google Cloud Console and Supabase

### OAuth works but user not authorized
- **Cause**: User's email not in `authorized_emails` table
- **Solution**: Add the user's email to `authorized_emails` table with role `manager` or `superadmin`

## Quick Fix: Disable Google Sign-In Button

If you don't want to set up Google OAuth, you can hide the button by commenting it out in `app/auth/signin/page.tsx`:

```tsx
{/* Comment out the Google sign-in section if not using OAuth */}
{/* 
<div className="mt-6">
  ... Google sign-in button ...
</div>
*/}
```

## Recommendation

For now, **use email/password authentication**. It's simpler and doesn't require additional OAuth setup. You can always enable Google OAuth later if needed.

