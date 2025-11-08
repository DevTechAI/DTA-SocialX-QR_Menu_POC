# Where Does the OAuth Redirect URL Come From?

## The OAuth Flow

1. **User clicks "Sign in with Google"** on `https://socialx.cafe/auth/signin`
2. **Our code** calls `supabase.auth.signInWithOAuth()` with `redirectTo: https://socialx.cafe/auth/callback`
3. **Supabase** redirects to Google OAuth (`https://accounts.google.com/...`)
4. **Google** authenticates the user
5. **Google** redirects back to Supabase: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
6. **Supabase** processes the OAuth code
7. **Supabase** then redirects to a URL from its **Redirect URLs whitelist** (NOT the `redirectTo` parameter!)

## ⚠️ Critical Point

The `redirectTo` parameter in our code is **only a suggestion**. Supabase will **ONLY** redirect to URLs that are in its **Redirect URLs whitelist** in the dashboard.

If `https://socialx.cafe/auth/callback` is NOT in the whitelist, Supabase will:
- Use the **Site URL** if it's in the whitelist
- Or use the **first URL** in the Redirect URLs list
- Or default to `localhost:3000` if that's the only one configured

## Why You're Getting `http://localhost:3000/?code=...`

This means Supabase is using `http://localhost:3000` from its configuration. The redirect is coming from **Supabase Dashboard → Authentication → URL Configuration**.

### Check These Settings:

1. **Site URL** (in Supabase Dashboard → Authentication → URL Configuration)
   - Should be: `https://socialx.cafe`
   - NOT: `http://localhost:3000`

2. **Redirect URLs** (in the same section)
   - Must include: `https://socialx.cafe/auth/callback`
   - Can also include: `http://localhost:3000/auth/callback` (for local dev)
   - The production URL should be **first** in the list, or at least present

3. **The redirect URL format**
   - Notice it's redirecting to `http://localhost:3000/?code=...` (missing `/auth/callback`)
   - This suggests the **Site URL** is set to `http://localhost:3000` and Supabase is using that as the base

## How to Fix

### Step 1: Update Site URL
1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://socialx.cafe`
3. **Save**

### Step 2: Verify Redirect URLs
1. In the same section, check **Redirect URLs**
2. Make sure `https://socialx.cafe/auth/callback` is in the list
3. Remove `http://localhost:3000` from the list (or keep it for local dev, but production should be first)
4. **Save**

### Step 3: Wait and Test
1. Wait 2-5 minutes for changes to propagate
2. Clear browser cache
3. Try OAuth again

## Visual Guide

In Supabase Dashboard → Authentication → URL Configuration, you should see:

```
Site URL:
https://socialx.cafe

Redirect URLs:
https://socialx.cafe/auth/callback
http://localhost:3000/auth/callback  (optional, for local dev)
```

**NOT:**
```
Site URL:
http://localhost:3000  ❌

Redirect URLs:
http://localhost:3000/auth/callback  ❌ (if this is the only one)
```

## Why This Happens

Supabase uses the **Site URL** as a fallback when:
- The `redirectTo` parameter doesn't match any whitelisted URL
- Or when determining the base URL for redirects

If your Site URL is `http://localhost:3000`, Supabase will redirect there even if you pass `https://socialx.cafe/auth/callback` in the code.

## Summary

**The redirect URL `http://localhost:3000/?code=...` is coming from Supabase's Site URL or Redirect URLs configuration, NOT from our code.**

Our code is correct - it's passing `https://socialx.cafe/auth/callback`, but Supabase is ignoring it because:
1. The Site URL is set to `http://localhost:3000`, OR
2. `https://socialx.cafe/auth/callback` is not in the Redirect URLs whitelist

Fix it in Supabase Dashboard → Authentication → URL Configuration.

