# claude-ai-librewolf-fix

Fixes Claude.ai freezing in LibreWolf by patching `Date.now()` to be monotonic.  
Site-scoped Tampermonkey userscript that preserves LibreWolf’s privacy protections.

---

## Fix Claude AI freezing in LibreWolf

Claude.ai sometimes freezes while generating responses in LibreWolf.  
This doesn’t happen in regular Firefox and seems random at first, but it’s reproducible once you know why.

I’ve hit this on both Linux and Windows.

---

## What’s going on

LibreWolf intentionally reduces JavaScript timer precision (`Date.now()`) as part of its fingerprinting resistance. Because of this, multiple calls to `Date.now()` can occasionally return the same value.

That behavior is expected in LibreWolf.

Claude’s frontend, however, assumes time always moves forward. While streaming a response, it repeatedly calls an internal function (~every 20–30 ms) that calculates elapsed time using `Date.now()`. When the delta is zero, the code gets stuck in an infinite loop and the page freezes.

So this is essentially a Claude frontend bug triggered by LibreWolf’s privacy protections.

---

## The fix (site-scoped, privacy-safe)

Instead of weakening LibreWolf globally, you can fix the issue only for `claude.ai` using a small Tampermonkey userscript.

The idea:

- Keep LibreWolf’s coarse timers
- Ensure `Date.now()` is monotonic
- Avoid zero or negative time deltas
- Don’t increase timer precision

---

## Recommended: Use the browser extension

The Tampermonkey userscript method described below is **unreliable** and may not work depending on your Tampermonkey version and configuration. A community member took the idea from this project and packaged it as a proper Firefox/LibreWolf extension, which works reliably:

**[Claude AI Freeze Fix for LibreWolf](https://addons.mozilla.org/sq/firefox/addon/claude-ai-freeze-fix-librewolf/)** (Firefox Add-ons)

The extension is based on this project and credits it. **If you just want the fix to work, use the extension.**

---

## Why the Tampermonkey method is unreliable

The userscript needs to override `Date.now()` in the **page’s own JavaScript context** (the "main world") before Claude’s code runs. This is where Tampermonkey falls short:

- **Content Security Policy (CSP):** Claude.ai sets a CSP that can block Tampermonkey from injecting scripts into the page context. When blocked, Tampermonkey **silently** falls back to an isolated sandbox where modifying `Date.now()` has no effect on the page’s actual `Date.now()`. The script runs without errors but the patch never reaches Claude’s code.
- **Firefox Xray Vision:** Firefox/LibreWolf content scripts run behind an isolation mechanism called [Xray Vision](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts). When the userscript ends up in a sandboxed world, page scripts see the *original* `Date.now()`, not the patched version. The reverse is also true — the content script world and the page world have separate views of global objects.
- **Execution timing:** Even with `@run-at document-start`, Tampermonkey dynamically matches URLs and injects scripts — adding a round-trip that native extensions don’t have. Claude.ai also uses service worker caching, which can make the page load so fast that the userscript arrives too late. A native extension’s `content_scripts` with `"run_at": "document_start"` is pre-registered in the manifest and injected before the HTML parser even creates the `<head>` element.
- **Silent fallback chain:** With `@grant none`, Tampermonkey targets main world injection (`raw` mode). If CSP blocks it, it silently falls back: MAIN_WORLD -> USERSCRIPT_WORLD -> ISOLATED_WORLD. Each step further isolates the script from the page. There is no warning or error when this happens.

A proper browser extension avoids all of these issues because it can declare `"world": "MAIN"` in its manifest, has CSP exemptions for manifest-declared content scripts, and has guaranteed pre-registration timing.

---

## Alternative: Tampermonkey userscript (unreliable)

If you still want to try the userscript approach:

- Install the Tampermonkey extension in LibreWolf
- Install the userscript by clicking [here](../../raw/main/claude-librewolf-fix.user.js)
- Reload `claude.ai`

If it works, Claude should stream responses normally without freezing. If it doesn’t, use the browser extension above instead.

### Tampermonkey workarounds you can try

If you want to try making the userscript work:

1. **Enable CSP modification:** In Tampermonkey Settings -> Advanced -> set "Modify existing content security policy (CSP) headers" to "Yes"
2. **Add `@sandbox raw`** to the userscript metadata to explicitly force main world injection
3. **Add `@unwrap`** to the userscript metadata to inject without any wrapper/sandbox

None of these are guaranteed to work on all Tampermonkey versions. The browser extension remains the most reliable solution.

### Last resort: Exempt claude.ai from fingerprinting resistance

If nothing else works, you can disable `privacy.resistFingerprinting` for claude.ai only. **This gives up privacy protections on that domain**, so only do this if the extension and userscript both fail for you.

1. Open `about:config` in LibreWolf
2. Search for `privacy.resistFingerprinting.exemptedDomains`
3. Set it to `*.claude.ai`

This restores full timer precision on claude.ai, which eliminates the freezing but also makes your browser more fingerprintable on that site. Use the browser extension instead if at all possible.

---

## Privacy notes

- This does not increase timer precision and preserves privacy
- Does not change any global LibreWolf settings
- Applies only to `claude.ai`

It simply prevents zero-delta timestamps that Claude’s code doesn’t handle correctly.
