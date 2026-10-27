// OpenFront Coach content script.
//
// Passive by design: OpenFront's terms forbid real-time assistance, so this
// script never changes the page, never reads game state, and never shows
// anything. It notices which game you're in (the game ID is in the URL) and
// which public player you are, and hands that to the extension. The coach
// only analyzes a game after OpenFront archives it, which happens when the
// game ends.

(() => {
  const GAME_RE = /\/game\/([A-Za-z0-9_-]{6,40})/;
  let current = null;

  // Your public player ID and name, as OpenFront caches them. We read only
  // the public ID cache and the display name: never your private
  // persistent ID or auth tokens.
  function identity() {
    let username = null;
    let publicId = null;
    try {
      username = localStorage.getItem("username");
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("cached_public_id_")) {
          publicId = localStorage.getItem(k);
          break;
        }
      }
    } catch {
      // storage blocked
    }
    return { username, publicId };
  }

  function isReplay() {
    return location.hostname.startsWith("replay.") || /replay-viewer=/.test(location.hash) || /[?&]replay/.test(location.search);
  }

  function check() {
    const m = location.pathname.match(GAME_RE);
    const gameId = m && !isReplay() ? m[1] : null;
    if (gameId && gameId !== current) {
      current = gameId;
      chrome.runtime.sendMessage({ type: "game-seen", gameId, url: location.href, ...identity() }).catch(() => {});
    } else if (!gameId && current) {
      chrome.runtime.sendMessage({ type: "game-left", gameId: current, ...identity() }).catch(() => {});
      current = null;
    }
  }

  // Tell the extension who you are even outside a game (for history import).
  chrome.runtime.sendMessage({ type: "identity", ...identity() }).catch(() => {});
  check();
  setInterval(check, 2000);
  window.addEventListener("pagehide", () => {
    if (current) chrome.runtime.sendMessage({ type: "game-left", gameId: current, ...identity() }).catch(() => {});
  });
})();
