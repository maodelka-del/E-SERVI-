import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import servicesRouter from "./services";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import reviewsRouter from "./reviews";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(categoriesRouter);
router.use(servicesRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(reviewsRouter);
router.use(messagesRouter);
router.use(notificationsRouter);
router.use(adminRouter);

export default router;
