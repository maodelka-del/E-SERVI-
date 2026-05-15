import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { ListMessagesParams, SendMessageParams, SendMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/messages/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db.select().from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.orderId, params.data.orderId))
    .orderBy(messagesTable.createdAt);

  res.json(messages.map(({ messages: m, users: u }) => ({
    id: m.id,
    orderId: m.orderId,
    senderId: m.senderId,
    content: m.content,
    attachmentUrl: m.attachmentUrl ?? null,
    createdAt: m.createdAt.toISOString(),
    sender: {
      id: u.id, name: u.name, email: u.email, role: u.role,
      avatarUrl: u.avatarUrl ?? null, bio: u.bio ?? null,
      location: u.location ?? null, phone: u.phone ?? null,
      isVerified: u.isVerified, isBanned: u.isBanned,
      createdAt: u.createdAt.toISOString(),
    },
  })));
});

router.post("/messages/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    orderId: params.data.orderId,
    senderId: req.user!.userId,
    content: parsed.data.content,
    attachmentUrl: parsed.data.attachmentUrl ?? null,
  }).returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

  res.status(201).json({
    id: msg.id,
    orderId: msg.orderId,
    senderId: msg.senderId,
    content: msg.content,
    attachmentUrl: msg.attachmentUrl ?? null,
    createdAt: msg.createdAt.toISOString(),
    sender: sender ? {
      id: sender.id, name: sender.name, email: sender.email, role: sender.role,
      avatarUrl: sender.avatarUrl ?? null, bio: sender.bio ?? null,
      location: sender.location ?? null, phone: sender.phone ?? null,
      isVerified: sender.isVerified, isBanned: sender.isBanned,
      createdAt: sender.createdAt.toISOString(),
    } : undefined,
  });
});

export default router;
