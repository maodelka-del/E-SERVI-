import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, paymentsTable, notificationsTable } from "@workspace/db";
import { CreateCheckoutBody, GetPaymentParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

const DIAMONOPAY_API_KEY = process.env.DIAMONOPAY_API_KEY ?? "";
const DIAMONOPAY_SECRET_KEY = process.env.DIAMONOPAY_SECRET_KEY ?? "";
const SUCCESS_URL = process.env.SUCCESS_URL ?? "http://localhost:80/orders";
const CANCEL_URL = process.env.CANCEL_URL ?? "http://localhost:80/orders";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "webhook-secret";

router.post("/payments/checkout", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const reference = `ESERV-${order.id}-${Date.now()}`;
  const amount = parseFloat(order.amount as string);

  // Create pending payment record
  await db.insert(paymentsTable).values({
    orderId: order.id,
    amount: String(amount),
    status: "pending",
    reference,
    provider: "diamonopay",
  }).onConflictDoNothing();

  // If DiamoPay keys are set, call real API. Otherwise simulate.
  if (DIAMONOPAY_API_KEY && DIAMONOPAY_SECRET_KEY) {
    try {
      const response = await fetch("https://api.diamonopay.com/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DIAMONOPAY_API_KEY}`,
        },
        body: JSON.stringify({
          amount,
          currency: "XOF",
          reference,
          description: `Commande #${order.id}`,
          success_url: `${SUCCESS_URL}/${order.id}?payment=success`,
          cancel_url: `${CANCEL_URL}/${order.id}?payment=cancelled`,
        }),
      });

      if (!response.ok) {
        throw new Error(`DiamoPay API error: ${response.status}`);
      }

      const data = await response.json() as { payment_url: string };
      res.json({ paymentUrl: data.payment_url, reference });
      return;
    } catch (err) {
      logger.error({ err }, "DiamoPay checkout failed");
    }
  }

  // Simulate payment URL (dev/demo mode)
  const simulatedUrl = `${SUCCESS_URL}?order=${order.id}&ref=${reference}&demo=true`;
  res.json({ paymentUrl: simulatedUrl, reference });
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const signature = req.headers["x-diamonopay-signature"] as string;

  if (signature && WEBHOOK_SECRET) {
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    if (signature !== expected) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }
  }

  const { reference, status } = req.body as { reference: string; status: string };
  if (!reference) {
    res.json({ received: true });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.reference, reference));
  if (!payment) {
    res.json({ received: true });
    return;
  }

  if (status === "success" || status === "paid") {
    await db.update(paymentsTable).set({ status: "paid" }).where(eq(paymentsTable.id, payment.id));
    await db.update(ordersTable).set({ status: "in_progress" }).where(eq(ordersTable.id, payment.orderId));

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, payment.orderId));
    if (order) {
      await db.insert(notificationsTable).values({
        userId: order.clientId,
        type: "payment_confirmed",
        title: "Paiement confirmé",
        body: `Votre paiement pour la commande #${order.id} a été confirmé`,
        link: `/orders/${order.id}`,
      });
    }
  } else if (status === "failed" || status === "cancelled") {
    await db.update(paymentsTable).set({ status: "failed" }).where(eq(paymentsTable.id, payment.id));
  }

  res.json({ received: true });
});

router.get("/payments/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.orderId, params.data.orderId));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json({
    id: payment.id,
    orderId: payment.orderId,
    amount: parseFloat(payment.amount as string),
    status: payment.status,
    reference: payment.reference,
    provider: payment.provider,
    createdAt: payment.createdAt.toISOString(),
  });
});

export default router;
