importScripts("config.js");
const { API_BASE } = self.BIOINSTA_CONFIG;

const processedHandles = new Set();

async function getStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function setStorage(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "PROFILE_DETECTED") return;

  (async () => {
    const { session, niche, city, captureEnabled = true, sessionCount = 0 } = await getStorage([
      "session",
      "niche",
      "city",
      "captureEnabled",
      "sessionCount",
    ]);

    if (!captureEnabled || !session?.access_token) return;
    if (!niche || !city) return; // nothing to tag the lead with yet
    if (processedHandles.has(message.profile.handle)) return;
    processedHandles.add(message.profile.handle);

    try {
      const res = await fetch(`${API_BASE}/api/leads/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ niche, city, profiles: [message.profile] }),
      });
      if (res.ok) {
        await setStorage({ sessionCount: sessionCount + 1 });
        chrome.action.setBadgeText({ text: String(sessionCount + 1) });
        chrome.action.setBadgeBackgroundColor({ color: "#db2777" });
      }
    } catch {
      // best-effort — a failed capture shouldn't break browsing
    }
  })();

  sendResponse({ ok: true });
});
