// ==UserScript==
// @name         Claude AI LibreWolf Freeze Fix
// @namespace    https://github.com/MuMashhour/claude-librewolf-freeze-fix
// @version      1.0.0
// @description  Work around Claude.ai freezing in LibreWolf caused by zero Date.now() deltas
// @match        https://claude.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    const originalNow = Date.now.bind(Date);
    let last = originalNow();

    Date.now = () => {
        const now = originalNow();

        // LibreWolf may return the same timestamp multiple times.
        // Claude's frontend doesn't handle that and can freeze.
        if (now <= last) {
            last += 1;
            return last;
        }

        last = now;
        return now;
    };
})();
