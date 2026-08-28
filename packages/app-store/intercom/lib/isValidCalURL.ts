import { CAL_URL } from "@calcom/lib/constants";

import type { TextComponent } from "../lib";
import { resolveCalBookingUrl } from "./resolveCalBookingUrl";

/**
 * Check that a submitted booking link is a live link on this instance.
 * @param url
 * @returns IsValid
 */
export async function isValidCalURL(url: string) {
  const error: TextComponent = {
    type: "text",
    text: `This is not a valid ${CAL_URL.replace("https://", "")} link`,
    style: "error",
    align: "left",
  };

  const target = resolveCalBookingUrl(url);

  if (!target)
    return {
      isValid: false,
      error,
    };

  // Redirects are deliberately not followed. Hostname validation decided the destination; letting
  // fetch follow a 3xx would hand that decision back to whatever the response says, and any open
  // redirect on this origin would become a route to an arbitrary host. A valid booking link
  // answers 200 directly, so a redirect is treated as "not a booking link" rather than chased.
  // No credentials, cookies or authorization headers are attached.
  const response = await fetch(target, { redirect: "manual" });

  if (response.status !== 200)
    return {
      isValid: false,
      error,
    };

  return {
    isValid: true,
  };
}
