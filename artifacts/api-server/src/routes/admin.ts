import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, usersTable, freelancerProfilesTable, servicesTable, ordersTable, paymentsTable } from "@workspace/db";
import { AdminListUsersQueryParams, AdminBanUserParams, AdminApproveServiceParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/admin/stats", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const [users, freelancers, services, orders, payments] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(freelancerProfilesTable),
    db.select({ count: sql<number>`count(*)` }).from(servicesTable),
    db.select().from(ordersTable),
    db.select().from(paymentsTable).where(eq(paymentsTable.status, "paid")),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount as string), 0);
  const commission = orders.reduce((sum, o) => sum + parseFloat(o.commission as string), 0);

  res.json({
    totalUsers: Number(users[0].count),
    totalFreelancers: Number(freelancers[0].count),
    totalServices: Number(services[0].count),
    totalOrders: orders.length,
    totalRevenue,
    platformCommission: commission,
    pendingOrders: orders.filter(o => o.status === "pending" || o.status === "in_progress").length,
    completedOrders: orders.filter(o => o.status === "completed").length,
  });
});

router.get("/admin/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AdminListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { q } = params.data;
  const users = q
    ? await db.select().from(usersTable).where(ilike(usersTable.name, `%${q}%`))
    : await db.select().from(usersTable).orderBy(usersTable.createdAt);

  res.json(users.map(u => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    avatarUrl: u.avatarUrl ?? null, bio: u.bio ?? null,
    location: u.location ?? null, phone: u.phone ?? null,
    isVerified: u.isVerified, isBanned: u.isBanned,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.post("/admin/users/:id/ban", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AdminBanUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ isBanned: !existing.isBanned })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  res.json({
    id: user.id, name: user.name, email: user.email, role: user.role,
    avatarUrl: user.avatarUrl ?? null, bio: user.bio ?? null,
    location: user.location ?? null, phone: user.phone ?? null,
    isVerified: user.isVerified, isBanned: user.isBanned,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/admin/services", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const services = await db.select().from(servicesTable).orderBy(servicesTable.createdAt);
  res.json(services.map(s => ({
    id: s.id, title: s.title, description: s.description,
    price: parseFloat(s.price as string), deliveryDays: s.deliveryDays,
    categoryId: s.categoryId, freelancerId: s.freelancerId,
    imageUrl: s.imageUrl ?? null, tags: s.tags ?? null,
    status: s.status, orderCount: s.orderCount,
    rating: parseFloat(s.rating as string), reviewCount: s.reviewCount,
    isFeatured: s.isFeatured, createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/admin/services/:id/approve", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = AdminApproveServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [service] = await db.update(servicesTable)
    .set({ status: "active" })
    .where(eq(servicesTable.id, params.data.id))
    .returning();

  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  res.json({
    id: service.id, title: service.title, description: service.description,
    price: parseFloat(service.price as string), deliveryDays: service.deliveryDays,
    categoryId: service.categoryId, freelancerId: service.freelancerId,
    imageUrl: service.imageUrl ?? null, tags: service.tags ?? null,
    status: service.status, orderCount: service.orderCount,
    rating: parseFloat(service.rating as string), reviewCount: service.reviewCount,
    isFeatured: service.isFeatured, createdAt: service.createdAt.toISOString(),
  });
});

router.get("/admin/orders", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
  res.json(orders.map(o => ({
    id: o.id, serviceId: o.serviceId, clientId: o.clientId, freelancerId: o.freelancerId,
    status: o.status, amount: parseFloat(o.amount as string),
    commission: parseFloat(o.commission as string),
    freelancerAmount: parseFloat(o.freelancerAmount as string),
    description: o.description, attachmentUrl: o.attachmentUrl ?? null,
    deliveryUrl: o.deliveryUrl ?? null, deliveryDays: o.deliveryDays,
    deadline: o.deadline.toISOString(), revisionNote: o.revisionNote ?? null,
    createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
  })));
});

export default router;
