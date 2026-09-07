# Secret Gift — prototype

This is the first front-end prototype for Secret Gift.

## Current state
- Mobile-first visual experience
- Garden welcome screen
- 8-step flow
- Garden's existing questions and answer choices
- Temporary front-end data only

## Next step
Connect the existing Supabase project without recreating any tables.

We will replace the temporary `steps`/`questions` data in `app.js` with Supabase queries and use a unique recipient token in the URL.

## Important
Do not put a Supabase `service_role` key in the browser. The browser may use the public `anon` key only, with Row Level Security correctly configured.
