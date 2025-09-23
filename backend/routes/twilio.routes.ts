import { Router, type Request, type Response } from "express";
import {
  receiveSmsWebhook,
  testSmsWebhook,
  getWebhookStatus,
  getTwilioLogs
} from "../controllers/twilio.controller.js";

const router = Router();

/**
 * Twilio SMS webhook receiver
 * This is the endpoint Twilio will POST to when SMS messages are received
 */
router.post("/webhook/sms", receiveSmsWebhook);

/**
 * Friendly helper for humans visiting the webhook in a browser
 * Browsers do GET, but Twilio will POST form-encoded bodies.
 */
router.get("/webhook/sms", (req: Request, res: Response) => {
  res
    .type("text")
    .status(405)
    .send(
      "This Twilio webhook only accepts POST requests (application/x-www-form-urlencoded).\n" +
        "To test manually, POST to /api/v1/twilio/webhook/sms with fields like Body, From, To.\n" +
        "See /api/v1/twilio/webhook/status for configuration info."
    );
});

/**
 * Test endpoint for local development
 * Simulates a Twilio webhook call for testing purposes
 */
router.post("/test/sms", testSmsWebhook);

/**
 * Webhook status and configuration info
 * Returns webhook URLs and configuration status
 */
router.get("/webhook/status", getWebhookStatus);

/**
 * Get Twilio webhook logs
 * Returns paginated list of webhook logs
 */
router.get("/logs", getTwilioLogs);

export default router;
