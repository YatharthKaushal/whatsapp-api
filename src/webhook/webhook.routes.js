// webhook.routes.js
import { Router } from "express";
import { verifyWebhook, handleWebhook } from "./webhook.controller.js";

const router = Router();

// GET /whatsapp/webhook - for webhook verification
router.get("/webhook", verifyWebhook);

// POST /whatsapp/webhook - for receiving webhook events
router.post("/webhook", handleWebhook);

export default router;
