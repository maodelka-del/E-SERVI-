import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, ordersTable, servicesTable, usersTable, freelancerProfilesTable, notificationsTable, paymentsTable } from "@workspace/db";
import {
  ListOrdersQueryParams, GetOrderParams, CreateOrderBody, DeliverOrderParams,
  DeliverOrderBody, AcceptDeliveryParams, RequestRevisionParams, RequestRevisionBody,
  CancelOrderParams
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const COMMISSION_RATE = 0.10;

async function formatOrder(o: typeof ordersTable.$inferSelect) {
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, o.serviceId));
  const [client] = await db.select().from(usersTable).where(eq(usersTable.id, o.clientId));
  const fpResult = await db.select().from(freelancerProfilesTable)
    .innerJoin(usersTable, eq(freelancerProfilesTable.userId, usersTable.id))
    .where(eq(freelancerProfilesTable.id, o.freelancerId));

  return {
    id: o.id,
    serviceId: o.serviceId,
    clientId: o.clientId,
    freelancerId: o.freelancerId,
    status: o.status,
    amount: parseFloat(o.amount as string),
    commission: parseFloat(o.commission as string),
    freelancerAmount: parseFloat(o.freelancerAmount as string),
    description: o.description,
    attachmentUrl: o.attachmentUrl ?? null,
    deliveryUrl: o.deliveryUrl ?? null,
    deliveryDays: o.deliveryDays,
    deadline: o.deadline.toISOString(),
    revisionNote: o.revisionNote ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    service: service ? {
      id: service.id, title: service.title, description: service.description,
      price: parseFloat(service.price as string), deliveryDays: service.deliveryDays,
      categoryId: service.categoryId, freelancerId: service.freelancerId,
      imageUrl: service.imageUrl ?? null, tags: service.tags ?? null,
      status: service.status, orderCount: service.orderCount,
      rating: parseFloat(service.rating as string), reviewCount: service.reviewCount,
      isFeatured: service.isFeatured, createdAt: service.createdAt.toISOString(),
    } : undefined,
    client: client ? {
      id: client.id, name: client.name, email: client.email, role: client.role,
      avatarUrl: client.avatarUrl ?? null, bio: client.bio ?? null,
      location: client.location ?? null, phone: client.phone ?? null,
      isVerified: client.isVerified, isBanned: client.isBanned,
      createdAt: client.createdAt.toISOString(),
    } : undefined,
    freelancer: fpResult[0] ? {
      id: fpResult[0].freelancer_profiles.id,
      userId: fpResult[0].freelancer_profiles.userId,
      level: fpResult[0].freelancer_profiles.level,
      skills: fpResult[0].freelancer_profiles.skills,
      totalEarnings: parseFloat(fpResult[0].freelancer_profiles.totalEarnings as string),
      completedOrders: fpResult[0].freelancer_profiles.completedOrders,
      rating: parseFloat(fpResult[0].freelancer_profiles.rating as string),
      reviewCount: fpResult[0].freelancer_profiles.reviewCount,
      isAvailable: fpResult[0].freelancer_profiles.isAvailable,
      createdAt: fpResult[0].freelancer_profiles.createdAt.toISOString(),
      user: {
        id: fpResult[0].users.id, name: fpResult[0].users.name, email: fpResult[0].users.email,
        role: fpResult[0].users.role, avatarUrl: fpResult[0].users.avatarUrl ?? null,
        bio: fpResult[0].users.bio ?? null, location: fpResult[0].users.location ?? null,
        phone: fpResult[0].users.phone ?? null, isVerified: fpResult[0].users.isVerified,
        isBanned: fpResult[0].users.isBanned, createdAt: fpResult[0].users.createdAt.toISOString(),
      }
    } : undefined,
  };
}

async function createNotification(userId: number, type: string, title: string, body: string, link?: string) {
  await db.insert(notificationsTable).values({ userId, type, title, body, link: link ?? null });
}

router.get("/orders/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  let whereClause;
  if (role === "freelancer") {
    const [fp] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, userId));
    if (!fp) {
      res.json({ totalOrders: 0, pendingOrders: 0, inProgressOrders: 0, completedOrders: 0, cancelledOrders: 0, totalRevenue: 0 });
      return;
    }
    whereClause = eq(ordersTable.freelancerId, fp.id);
  } else {
    whereClause = eq(ordersTable.clientId, userId);
  }

  const allOrders = await db.select().from(ordersTable).where(whereClause);

  res.json({
    totalOrders: allOrders.length,
    pendingOrders: allOrders.filter(o => o.status === "pending").length,
    inProgressOrders: allOrders.filter(o => o.status === "in_progress" || o.status === "paid").length,
    completedOrders: allOrders.filter(o => o.status === "completed").length,
    cancelledOrders: allOrders.filter(o => o.status === "cancelled").length,
    totalRevenue: allOrders.filter(o => o.status === "completed").reduce((sum, o) => sum + parseFloat(o.amount as string), 0),
  });
});

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const qp = ListOrdersQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const userId = req.user!.userId;
  const role = req.user!.role;
  const { status } = qp.data;

  let conditions: ReturnType<typeof eq>[] = [];
  if (role === "freelancer") {
    const [fp] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, userId));
    if (fp) conditions.push(eq(ordersTable.freelancerId, fp.id));
  } else if (role === "client") {
    conditions.push(eq(ordersTable.clientId, userId));
  }

  if (status) {
    conditions.push(eq(ordersTable.status, status as "pending" | "paid" | "in_progress" | "delivered" | "revision" | "completed" | "cancelled" | "refunded"));
  }

  const orders = conditions.length > 0
    ? await db.select().from(ordersTable).where(and(...conditions))
    : await db.select().from(ordersTable);

  const formatted = await Promise.all(orders.map(formatOrder));
  res.json(formatted);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, parsed.data.serviceId));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  const amount = parseFloat(service.price as string);
  const commission = amount * COMMISSION_RATE;
  const freelancerAmount = amount - commission;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + service.deliveryDays);

  const [order] = await db.insert(ordersTable).values({
    serviceId: parsed.data.serviceId,
    clientId: req.user!.userId,
    freelancerId: service.freelancerId,
    status: "pending",
    amount: String(amount),
    commission: String(commission),
    freelancerAmount: String(freelancerAmount),
    description: parsed.data.description,
    attachmentUrl: parsed.data.attachmentUrl ?? null,
    deliveryDays: service.deliveryDays,
    deadline,
  }).returning();

  const [fpUser] = await db.select({ userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, service.freelancerId));

  if (fpUser) {
    await createNotification(fpUser.userId, "new_order", "Nouvelle commande", `Vous avez reçu une nouvelle commande #${order.id}`, `/orders/${order.id}`);
  }

  res.status(201).json(await formatOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(await formatOrder(order));
});

router.post("/orders/:id/deliver", requireAuth, async (req, res): Promise<void> => {
  const params = DeliverOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = DeliverOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: "delivered", deliveryUrl: parsed.data.deliveryUrl })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await createNotification(order.clientId, "order_delivered", "Commande livrée", `Votre commande #${order.id} a été livrée`, `/orders/${order.id}`);

  res.json(await formatOrder(order));
});

router.post("/orders/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const params = AcceptDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: "completed" })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Update freelancer stats
  await db.execute(sql`
    UPDATE freelancer_profiles 
    SET completed_orders = completed_orders + 1,
        total_earnings = total_earnings + ${order.freelancerAmount},
        level = CASE 
          WHEN completed_orders + 1 >= 50 THEN 'expert'
          WHEN completed_orders + 1 >= 10 THEN 'confirmé'
          ELSE 'débutant'
        END
    WHERE id = ${order.freelancerId}
  `);

  await db.execute(sql`UPDATE services SET order_count = order_count + 1 WHERE id = ${order.serviceId}`);

  // Update payment status
  await db.update(paymentsTable).set({ status: "paid" }).where(eq(paymentsTable.orderId, order.id));

  const [fpUser] = await db.select({ userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, order.freelancerId));
  if (fpUser) {
    await createNotification(fpUser.userId, "payment_released", "Paiement libéré", `Le paiement de la commande #${order.id} a été libéré`, `/orders/${order.id}`);
  }

  res.json(await formatOrder(order));
});

router.post("/orders/:id/request-revision", requireAuth, async (req, res): Promise<void> => {
  const params = RequestRevisionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RequestRevisionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: "revision", revisionNote: parsed.data.note })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [fpUser] = await db.select({ userId: freelancerProfilesTable.userId })
    .from(freelancerProfilesTable).where(eq(freelancerProfilesTable.id, order.freelancerId));
  if (fpUser) {
    await createNotification(fpUser.userId, "revision_requested", "Révision demandée", `Le client demande une révision pour la commande #${order.id}`, `/orders/${order.id}`);
  }

  res.json(await formatOrder(order));
});

router.post("/orders/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const params = CancelOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(await formatOrder(order));
});

export default router;
