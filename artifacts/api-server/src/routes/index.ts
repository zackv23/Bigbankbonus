import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import bonusesRouter from "./bonuses";
import plaidRouter from "./plaid";
import autopayRouter from "./autopay";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agentRouter);
router.use(bonusesRouter);
router.use(plaidRouter);
router.use(autopayRouter);

export default router;
