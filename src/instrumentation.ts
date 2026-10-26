export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateRuntimeEnv } = await import("./lib/env");
    validateRuntimeEnv();
    await import("./sentry.server.config");
    const { startReminderScheduler } = await import("./lib/telegram/scheduler");
    startReminderScheduler();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
