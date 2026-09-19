import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// The same geometry as src/app/icon.svg, without the rounded corners —
// iOS applies its own mask to home-screen icons.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" fill="#1f2328"/><rect x="5.5" y="9.5" width="20" height="14" rx="4" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.6"/><path d="M12 11.5V18.8Q12 21 14.2 21H14.8M9.8 14.2H14.6M18 14.2V21M18 16.8Q18 14.2 21 14.2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="9.5" r="3.2" fill="#3fb950" stroke="#1f2328" stroke-width="1.6"/></svg>`;

/** The home-screen icon, rendered from the brand mark. */
export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
      width={180}
      height={180}
      alt=""
    />,
    size
  );
}
