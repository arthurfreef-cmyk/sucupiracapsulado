<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep payment API routes limited to Web-standard, edge-compatible dependencies because all routes share the production server bundle.
- Use the browser-safe shared kit pricing module for storefront prices, comparison anchors and all regular-kit payment providers; integer cents prevent campaign totals from drifting.
- Generate PIX QR images in the browser from the provider's copy-and-paste code so server payment routes remain edge-compatible.
- Keep the primary Fruitfy charge handler separate from the preserved legacy providers and validate its payload/response in a browser-safe module; this prevents provider schema drift and enables isolated tests.
- Initialize Fruitfy Pixel Booster once in the root after hydration on all pages; this preserves checkout hydration while keeping provider tracking available throughout the site.
- Use the shared checkout utility for express shipping display and request totals, and bind resolved addresses to their ZIP code; this prevents mismatched charges and stale delivery details.
- Isolate checkout tracking calls from payment processing; third-party tracking exceptions must never prevent charge creation or hide a generated PIX.
- Persist validated pending checkout PIX per kit and resume confirmation after reload; route paid customers to the offer only when its original-order handoff was saved, so unavailable browser storage cannot create a dead end.
- Normalize country-coded phone autofill through the browser-safe checkout utility; pasted Brazilian numbers must retain their actual area code and subscriber number.
- Resolve checkout ZIP codes through a validated browser-safe lookup with a secondary provider and manual completion for missing address data; provider outages must not invalidate ZIP codes or substitute invented delivery details.
- Serve optimized site media through the shared browser-safe media manifest and CDN pointers; use responsive hero sources and poster-first, no-preload testimonial videos so media does not compete with initial rendering.
- Initialize the UTMify pixel once after hydration on all pages, independently of attribution and payments; this replaces LowTrack without changing initial checkout rendering.
- Keep `/upsell` and its existing offer aliases on one shared page, poll signed payment references, and restore pending offer PIX per original order; this prevents divergent offers and repeat charges on refresh.
- Keep checkout totals alongside the form on wide screens and after it on mobile, with one shared submit control; this preserves a consistent flow without duplicate charges or hidden fields.
- Load UTMify attribution once after hydration using the supplied prevent-xcod-sck and prevent-subids attributes; this keeps vendor DOM changes outside initial checkout hydration.
