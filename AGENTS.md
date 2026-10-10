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
- Generate PIX QR images in the browser from the provider's copy-and-paste code so server payment routes remain edge-compatible.
- Keep the primary Fruitfy charge handler separate from the preserved legacy providers and validate its payload/response in a browser-safe module; this prevents provider schema drift and enables isolated tests.
- Initialize Fruitfy Pixel Booster once in the root after hydration on all pages; this preserves checkout hydration while keeping provider tracking available throughout the site.
- Use the shared checkout utility for express shipping display and request totals, and bind resolved addresses to their ZIP code; this prevents mismatched charges and stale delivery details.
- Isolate checkout tracking calls from payment processing; third-party tracking exceptions must never prevent charge creation or hide a generated PIX.
- Normalize country-coded phone autofill through the browser-safe checkout utility; pasted Brazilian numbers must retain their actual area code and subscriber number.
