import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import bonusesRouter from "./bonuses";
import plaidRouter from "./plaid";
import autopayRouter from "./autopay";
import subscriptionsRouter from "./subscriptions";
import authRouter from "./auth";
import monitorRouter from "./monitor";
import storageRouter from "./storage";
import uploadsRouter from "./uploads";
import recommendationsRouter from "./recommendations";
import depositRouter from "./deposit";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(bonusesRouter);
router.use(plaidRouter);
router.use(autopayRouter);
router.use(subscriptionsRouter);
router.use(authRouter);
router.use(monitorRouter);
router.use(storageRouter);
router.use(uploadsRouter);
router.use(recommendationsRouter);
router.use(depositRouter);
router.use(webhooksRouter);

export default router;
