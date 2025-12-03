# Vercel Deployment Checklist for OAuth

## Critical Steps for OAuth to Work in Production

### 1. Supabase Configuration (MUST DO)

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

**Redirect URLs** must include:
- ✅ `https://socialx.cafe/auth/callback` (your production domain)
- ✅ `http://localhost:3000/auth/callback` (for local development - optional but recommended)

**Site URL** should be:
- ✅ `https://socialx.cafe` (your production domain)

**⚠️ IMPORTANT:** After adding/updating URLs in Supabase:
- Wait 2-3 minutes for changes to propagate
- Clear your browser cache
- Try again

### 2. Google Cloud Console Configuration

Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**

Your OAuth 2.0 Client ID must have:
- ✅ `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback` in **Authorized redirect URIs**
  - Replace `YOUR_PROJECT_ID` with your actual Supabase project ID

### 3. Vercel Environment Variables

Make sure these are set in **Vercel Dashboard** → **Settings** → **Environment Variables**:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key

**⚠️ IMPORTANT:** After adding environment variables:
- Redeploy your application in Vercel
- Environment variables are only available after redeployment

### 4. Verify Supabase Redirect URL Format

The URL in Supabase must be **exactly**:
```
https://socialx.cafe/auth/callback
```

**Common mistakes:**
- ❌ `http://socialx.cafe/auth/callback` (missing `s` in `https`)
- ❌ `https://socialx.cafe` (missing `/auth/callback`)
- ❌ `https://www.socialx.cafe/auth/callback` (if you don't use www)
- ❌ `https://socialx.cafe/auth/callback/` (trailing slash)

### 5. Testing After Deployment

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Visit `https://socialx.cafe/auth/signin`
3. Click "Sign in with Google"
4. After Google sign-in, it should redirect to `https://socialx.cafe/auth/callback` (NOT localhost)
5. Then redirect to `https://socialx.cafe/admin`

### 6. If Still Redirecting to Localhost

**Check these:**

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
   - Verify `https://socialx.cafe/auth/callback` is in the list
   - Check for typos
   - Make sure it's saved

2. **Wait for propagation**
   - Supabase changes can take 2-5 minutes to propagate
   - Try again after waiting

3. **Check browser console** (F12)
   - Look for any errors
   - Check Network tab to see where redirects are going

4. **Check Vercel logs**
   - Go to Vercel Dashboard → Your Project → Deployments → Click on latest deployment → Functions tab
   - Look for errors in `/api/auth/callback` route

5. **Verify environment variables in Vercel**
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - They should NOT have `localhost` in them

### 7. Quick Test

To verify your Supabase configuration is correct:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Copy the exact URL from "Redirect URLs" list
3. It should match: `https://socialx.cafe/auth/callback` (exactly, no trailing slash)

## Still Not Working?

If after following all steps it still redirects to localhost:

1. **Double-check Supabase URL Configuration** - This is the #1 cause
2. **Wait 5 minutes** after making changes in Supabase
3. **Clear all browser data** for socialx.cafe
4. **Try incognito/private window**
5. **Check Vercel deployment logs** for any errors

The code is already configured correctly to use dynamic URLs. The issue is almost always in Supabase configuration.








sample text