import { Router } from "express";
import {
  receiveSmsWebhook,
  testSmsWebhook,
  getWebhookStatus,
  getTwilioLogs
} from "../controllers/twilio.controller";

const router = Router();

/**
 * Twilio SMS webhook receiver
 * This is the endpoint Twilio will POST to when SMS messages are received
 */
router.post("/webhook/sms", receiveSmsWebhook);

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
