# Save progress from your phone

This repository includes a manual GitHub Actions checkpoint tool. It saves a new checkpoint at the top of `HANDOFF-live.md` and commits it to `main`.

## How to use it

1. Open the repository: https://github.com/stermontmall/stermontmall.github.io
2. Tap **Actions**.
3. Choose **Save progress checkpoint**.
4. Tap **Run workflow**.
5. Enter the required **Summary**. Add what is completed, what should happen next, blockers, and the working branch or PR if known.
6. Tap **Run workflow** again to start the save.
7. Open the run and wait for the green check. The workflow commits the checkpoint to `main`.

Direct workflow page: https://github.com/stermontmall/stermontmall.github.io/actions/workflows/save-progress.yml

## What it saves

- Date and time in Africa/Nairobi
- Summary of the work
- Completed items
- Next steps
- Blockers / owner actions
- Working branch or pull request

## Important limitations

- This is a manual checkpoint, not an automatic detector of ChatGPT usage limits. Save after each meaningful task or before ending a session.
- It saves the progress details you enter; it does not automatically capture unsaved chat messages or uncommitted code.
- The workflow needs GitHub Actions to be enabled and the linked GitHub account to have permission to run workflows and write to `main`.
- If branch protection blocks direct pushes to `main`, the workflow will fail rather than bypass that protection.
- Code changes should still be committed to their working branch. This tool records the handoff and recovery instructions; it does not commit unfinished code from another branch.


## 2026-11-03 — checkout card-payment visibility fix
- [x] Found the card checkout UI was explicitly disabled in `checkout-deferred.js` via `CFG.card: false`, so the Visa/Mastercard Paystack option never rendered.
- [x] Changed `CFG.card` to `true` on `main` so the card option is rendered in checkout. GitHub commit: `20e05992cef9e47cdc0de5125cb463ec3778af9f`.
- [x] Confirmed the shell checkout handoff routes to `/classic.html?checkout=1` and loads `checkout-deferred.js`; checkout route remains exempt from the storefront shell redirect.
- [!] Payment acceptance still depends on Supabase Edge Function `paystack-init` having a valid live Paystack secret (`sk_live_...`) and the merchant account being live. I could not inspect the secret value through available Supabase tools or verify a live charge in this session. Do not claim live card payment was tested.
- [ ] Next verification: run checkout on the live website with a cart, confirm card option renders, and complete a Paystack live test/real authorized payment; inspect Paystack dashboard and Supabase `card_payments` + order record.


## 2026-11-11 — checkout handoff performance fix
- [x] Found the mobile-shell checkout wait was coupled to the storefront's full product-card build. The storefront fetches the complete active catalogue (including descriptions), so checkout could remain on “Preparing your checkout...” on slower mobile connections.
- [x] Updated the inline handoff in `checkout.html` to fetch only the exact product rows in `stm_handoff` from Supabase REST (`id=in.(...)`, selecting id/name/price/stock/images), create minimal off-screen checkout cards, and hand them to the existing `STM.add` flow. Live database prices are still compared with the price shown in the shell; changed prices are refused.
- [x] Start handoff polling immediately while the targeted request runs; retain the full-catalogue cards as fallback. Added a bounded 15-second failure state with a retry button instead of an indefinite loading cover. Cart handoff remains saved if products cannot be loaded.
- [x] GitHub commit on `main`: `d1c1a6aedb4c27ecd5a3d1134a1cc1f14052ccb3` (follow-up to `fc00285840300e6d1a3898060d738b8050a1b124`).
- [!] This is a code-level fix committed to GitHub; a live customer checkout and payment were not submitted in this session. The Paystack card option remains deliberately fail-closed in `checkout-deferred.js` (`CFG.card: false`) until live credentials and a real payment flow are verified; do not claim card payment is live based on the old progress note.
