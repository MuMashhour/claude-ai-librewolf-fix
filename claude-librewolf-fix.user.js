// ==UserScript==
// @name         Claude AI LibreWolf Freeze Fix
// @namespace    https://github.com/MuMashhour/claude-ai-librewolf-fix
// @version      2.0.0
// @description  Work around Claude.ai freezing in LibreWolf caused by zero Date.now() deltas
// @match        https://claude.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    const originalNow = Performance.now.bind(Performance);
    let last = originalNow();

    Performance.now = () => {
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
