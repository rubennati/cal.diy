import type { NextApiRequest, NextApiResponse } from "next";

import logger from "@calcom/lib/logger";

import getAppKeysFromSlug from "../../_utils/getAppKeysFromSlug";
import appConfig from "../config.json";
import { handleButtonAndInvitationStep } from "../lib/configure/button";
import { handleLinkStep } from "../lib/configure/link";
import { INTERCOM_SIGNATURE_HEADER, verifyCanvasSignature } from "../lib/verifyCanvasSignature";
import { appKeysSchema } from "../zod";

const log = logger.getSubLogger({ prefix: ["[[intercom/api/configure]"] });

/**
 * Body parsing is disabled because the Intercom signature covers the raw request bytes; a
 * re-serialised body would not reproduce them. The route at
 * `apps/web/pages/api/integrations/intercom/configure.ts` re-declares this — Next.js reads the
 * config from the route module, not from here.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

// A canvas payload is a handful of small strings. The cap stops an unauthenticated caller from
// making the server buffer arbitrary data before the signature has been checked.
const MAX_BODY_BYTES = 64 * 1024;

async function readRawBody(req: NextApiRequest): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) return null;
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Fail closed when the app is not configured: without a client secret there is no way to
  // establish that a request came from Intercom, and an unverifiable request is not served.
  const appKeys = await getAppKeysFromSlug(appConfig.slug);
  const parsedKeys = appKeysSchema.safeParse(appKeys);
  if (!parsedKeys.success || parsedKeys.data.client_secret.length === 0) {
    log.warn("Rejected a configure request: Intercom app keys are not configured.");
    return res.status(403).json({ message: "Forbidden" });
  }

  const rawBody = await readRawBody(req);
  if (!rawBody) {
    return res.status(413).json({ message: "Payload Too Large" });
  }

  const verified = verifyCanvasSignature({
    rawBody,
    signature: req.headers[INTERCOM_SIGNATURE_HEADER],
    clientSecret: parsedKeys.data.client_secret,
  });

  if (!verified) {
    // Nothing from the request body is logged: it is unauthenticated input at this point.
    log.warn("Rejected a configure request with a missing or invalid Intercom signature.");
    return res.status(401).json({ message: "Unauthorized" });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (typeof body !== "object" || body === null) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  // The downstream step handlers read `req.body`, which is unset because parsing is disabled.
  req.body = body;

  const { input_values, current_canvas } = req.body;

  const linkStepResult = current_canvas?.stored_data?.submit_booking_url
    ? current_canvas.stored_data.submit_booking_url
    : await handleLinkStep(req);
  if (typeof linkStepResult !== "string") {
    return res.status(200).json(linkStepResult);
  }
  const buttonAndInvitationStepResult = await handleButtonAndInvitationStep(req);
  if (buttonAndInvitationStepResult) {
    return res.status(200).json(buttonAndInvitationStepResult);
  }

  return res.status(200).json({
    results: {
      ...input_values,
      submit_booking_url: current_canvas?.stored_data?.submit_booking_url,
    },
  });
}
