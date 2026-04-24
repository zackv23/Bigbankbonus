import { runMonitorEngine, runHealthCheck } from "./monitorEngine";

const MONITOR_INTERVAL_MS = (parseInt(process.env.MONITOR_INTERVAL_HOURS ?? "6", 10) || 6) * 3600 * 1000;
const HEALTH_INTERVAL_MS = 3600 * 1000;
const MAX_SOURCES_PER_RUN = parseInt(process.env.MONITOR_MAX_SOURCES ?? "0", 10) || 0;

let monitorTimer: ReturnType<typeof setInterval> | null = null;
let healthTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let isHealthRunning = false;

async function doMonitorRun() {
  if (isRunning) return;
  isRunning = true;
  try {
    const opts = MAX_SOURCES_PER_RUN > 0 ? { maxSources: MAX_SOURCES_PER_RUN } : {};
    await runMonitorEngine(opts);
  } catch (err) {
    console.error("[monitor] Engine run failed:", err);
  } finally {
    isRunning = false;
  }
}

async function doHealthRun() {
  if (isHealthRunning) return;
  isHealthRunning = true;
  try {
    const opts = MAX_SOURCES_PER_RUN > 0 ? { maxSources: MAX_SOURCES_PER_RUN } : {};
    await runHealthCheck(opts);
  } catch (err) {
    console.error("[monitor] Health check failed:", err);
  } finally {
    isHealthRunning = false;
  }
}

export function startMonitorScheduler() {
  if (monitorTimer) return;
  console.log(`[monitor] Scheduler started — interval: ${MONITOR_INTERVAL_MS / 3600000}h`);

  monitorTimer = setInterval(doMonitorRun, MONITOR_INTERVAL_MS);
  healthTimer = setInterval(doHealthRun, HEALTH_INTERVAL_MS);

  setTimeout(doHealthRun, 5000);
}

export function stopMonitorScheduler() {
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  if (healthTimer) { clearInterval(healthTimer); healthTimer = null; }
  console.log("[monitor] Scheduler stopped");
}

export function triggerMonitorRun() {
  return doMonitorRun();
}

export function triggerHealthRun() {
  return doHealthRun();
}
