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

### Step 3: Add Redirect URL (IMPORTANT FOR PRODUCTION)

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production - **REPLACE with your actual domain**)
   - `https://yourdomain.com/api/auth/callback` (if using API route directly)

**⚠️ CRITICAL:** If you're deploying to production, you **MUST** add your production URL to the Redirect URLs list. If you only have `localhost:3000` configured, OAuth will redirect to localhost even in production!

**Example for Vercel deployment:**
- `https://your-app-name.vercel.app/auth/callback`
- `https://your-custom-domain.com/auth/callback`

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

### OAuth redirects to localhost in production
- **Cause**: Production URL not added to Supabase Redirect URLs
- **Symptoms**: After Google sign-in, redirects to `http://localhost:3000/?code=...` even in production
- **Solution**: 
  1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
  2. Add your production URL to **Redirect URLs**: `https://your-production-domain.com/auth/callback`
  3. Make sure to replace `your-production-domain.com` with your actual domain
  4. Save and try again
- **Note**: The code already uses `window.location.origin` dynamically, but Supabase must have the production URL whitelisted

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

