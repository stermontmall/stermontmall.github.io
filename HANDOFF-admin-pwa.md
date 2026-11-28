# HANDOFF: admin PWA / APK (wip-admin-pwa)

Date: 2026-11-28. Status: in progress, NOT merged, NOT tested in a browser or on a phone.

## Decisions
- The installable admin is the Neon admin (neon-admin.html, plus neon-admin-orders.html). admin.html and admin-manifest.json are the older Supabase admin and are left alone.
- Own manifest (neon-admin-manifest.json, scope /neon-admin) and own service worker (admin-sw.js, scope /neon-admin) so the storefront sw.js never caches admin pages. admin-sw.js is network-only plus an offline message.
- Reuses the existing icon-admin-*.png icons.
- APK: Trusted Web Activity built from the live URL with PWABuilder (no Android tooling in the Claude session).

## Done
- neon-admin-manifest.json, admin-sw.js added.

## Left
- Link the manifest and register admin-sw.js in neon-admin.html (and neon-admin-orders.html).
- Merge, then on a phone open https://stermontarcade.co.ke/neon-admin.html in Chrome and confirm Install app appears and sign-in still works in the installed app.
- Build the APK: pwabuilder.com with that URL, Android package; keep the signing key safe. Then add /.well-known/assetlinks.json with the package name and the key's SHA-256 fingerprint so the app opens without a browser bar.
