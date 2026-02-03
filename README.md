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

## How to use

- Install the Tampermonkey extension in LibreWolf
- Create a new userscript
- Paste the code above
- Reload `claude.ai`

Claude should now stream responses normally without freezing.

---

## Privacy notes

- This does not increase timer precision and preserves privacy
- Does not change any global LibreWolf settings
- Applies only to `claude.ai`

It simply prevents zero-delta timestamps that Claude’s code doesn’t handle correctly.
