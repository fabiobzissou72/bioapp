// Runs on instagram.com. Detects when the user is looking at a profile page
// (real navigation, driven by the person actually browsing — this script
// never clicks, scrolls, or searches on its own) and sends the visible
// bio/name/link info to the background worker for analysis.

const EXCLUDED_PATHS = [
  "explore",
  "reels",
  "direct",
  "accounts",
  "stories",
  "p",
  "reel",
  "about",
  "legal",
  "developer",
];

function currentProfileHandle() {
  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null;
  const handle = segments[0];
  if (EXCLUDED_PATHS.includes(handle)) return null;
  return handle;
}

function extractProfile(handle) {
  const header = document.querySelector("header");
  if (!header) return null;

  // Full name: usually a short text block near the top of the header that
  // isn't the @handle itself and isn't purely numeric (post/follower counts).
  let fullName = "";
  const candidates = header.querySelectorAll("span, h1, h2");
  for (const node of candidates) {
    const text = node.textContent?.trim() || "";
    if (text && text !== handle && text.length < 60 && !/^[\d.,]+$/.test(text)) {
      fullName = text;
      break;
    }
  }

  // Bio: the longest text block in the header that isn't the name/handle.
  let bioText = "";
  const bioCandidates = header.querySelectorAll("div span, div");
  for (const node of bioCandidates) {
    const text = node.textContent?.trim() || "";
    if (text.length > bioText.length && text.length < 500 && text !== fullName && text !== handle) {
      bioText = text;
    }
  }

  // External link in bio: an <a> in the header pointing off Instagram.
  let hasLinkInBio = false;
  header.querySelectorAll("a[href]").forEach((a) => {
    try {
      const url = new URL(a.href);
      if (!url.hostname.includes("instagram.com")) hasLinkInBio = true;
    } catch {
      /* ignore invalid hrefs */
    }
  });

  return {
    handle,
    fullName,
    bioText,
    hasLinkInBio,
    profileUrl: location.href,
  };
}

let lastHandle = null;

function checkAndSend() {
  const handle = currentProfileHandle();
  if (!handle || handle === lastHandle) return;

  // Instagram is a client-rendered SPA — give the profile content a moment
  // to actually paint before reading it.
  setTimeout(() => {
    if (currentProfileHandle() !== handle) return; // navigated away already
    const profile = extractProfile(handle);
    if (!profile || (!profile.bioText && !profile.fullName)) return;
    lastHandle = handle;
    chrome.runtime.sendMessage({ type: "PROFILE_DETECTED", profile });
  }, 900);
}

checkAndSend();
const observer = new MutationObserver(() => checkAndSend());
observer.observe(document.body, { childList: true, subtree: true });
