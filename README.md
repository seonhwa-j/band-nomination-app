# Band Nomination App

Vue/Vite mobile webapp for band song nominations, role-based voting, and discussion.

## Scripts

```bash
npm install
npm run dev
```

## Environment

This repo commits `.env` so a fresh checkout has the shared Vite/Supabase defaults.

Use `.env.local` only for machine-specific overrides. Vite loads `.env` first, then `.env.local`, so local values win without changing Git-tracked defaults.

```bash
cp .env .env.local
```

Do not put member passwords in Vite env files. Any variable starting with `VITE_` is exposed to the browser bundle.

Member login uses Supabase email magic links. Add each member as a Supabase Auth user, insert their band profile into `public.users`, then map the Auth user to the profile in `public.member_auth`.

For Supabase Auth URL Configuration, use:

```text
Site URL: https://band-nomination-app.vercel.app
Redirect URLs:
https://band-nomination-app.vercel.app/**
http://localhost:5173/**
```
