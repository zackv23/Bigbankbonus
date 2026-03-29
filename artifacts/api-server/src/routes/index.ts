import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import bonusesRouter from "./bonuses";
import plaidRouter from "./plaid";
import autopayRouter from "./autopay";
import subscriptionsRouter from "./subscriptions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(bonusesRouter);
router.use(plaidRouter);
router.use(autopayRouter);
router.use(subscriptionsRouter);

export default router;
