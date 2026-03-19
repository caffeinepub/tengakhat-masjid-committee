/**
 * Wraps a backend call with automatic retry logic for IC0508 (canister stopped) errors.
 * Shows a toast-style banner while retrying.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

function isCanisterStoppedError(err: unknown): boolean {
  const msg = String(err);
  return (
    msg.includes("IC0508") ||
    msg.includes("canister is stopped") ||
    msg.includes("canister stopped")
  );
}

let retryBannerEl: HTMLElement | null = null;

function showRetryBanner(attempt: number) {
  if (!retryBannerEl) {
    retryBannerEl = document.createElement("div");
    retryBannerEl.style.cssText = [
      "position:fixed",
      "top:16px",
      "left:50%",
      "transform:translateX(-50%)",
      "background:#1a3a2a",
      "color:#fff",
      "padding:10px 24px",
      "border-radius:8px",
      "font-size:14px",
      "z-index:9999",
      "box-shadow:0 4px 16px rgba(0,0,0,0.3)",
      "display:flex",
      "align-items:center",
      "gap:10px",
    ].join(";");
    document.body.appendChild(retryBannerEl);
  }
  retryBannerEl.innerHTML = `<span style="animation:spin 1s linear infinite;display:inline-block">&#8635;</span> Reconnecting to server... (attempt ${attempt}/${MAX_RETRIES})`;
  retryBannerEl.style.display = "flex";
}

function hideRetryBanner() {
  if (retryBannerEl) {
    retryBannerEl.style.display = "none";
  }
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const result = await fn();
      hideRetryBanner();
      return result;
    } catch (err) {
      lastErr = err;
      if (isCanisterStoppedError(err) && attempt <= MAX_RETRIES) {
        showRetryBanner(attempt);
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        continue;
      }
      hideRetryBanner();
      throw err;
    }
  }
  hideRetryBanner();
  throw lastErr;
}
