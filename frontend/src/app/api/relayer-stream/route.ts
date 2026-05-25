import { existsSync } from "node:fs";
import { open } from "node:fs/promises";

const LOG_PATH = process.env.RELAYER_LOG_PATH ?? "/tmp/posthook-relay.log";

/**
 * Server-Sent Events endpoint that tails the relayer log file. Sends new
 * lines as `data: <json>\n\n`. The relayer is launched separately
 * (`bash contracts/relayer/relay.sh`); it tees its stdout into LOG_PATH.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();

  let position = 0;
  let aborted = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const safeEnqueue = (chunk: string) => {
        if (aborted) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          aborted = true;
          if (pollInterval) clearInterval(pollInterval);
          if (pingInterval) clearInterval(pingInterval);
        }
      };

      const send = (payload: object) =>
        safeEnqueue(`data: ${JSON.stringify(payload)}\n\n`);

      send({ kind: "boot", path: LOG_PATH });

      const tick = async () => {
        if (aborted) return;
        try {
          if (!existsSync(LOG_PATH)) {
            send({ kind: "wait", message: "relayer not started" });
            return;
          }
          const fh = await open(LOG_PATH, "r");
          try {
            const stat = await fh.stat();
            if (position > stat.size) position = 0; // log got truncated
            if (stat.size > position) {
              const buf = Buffer.alloc(stat.size - position);
              await fh.read(buf, 0, buf.length, position);
              position = stat.size;
              for (const raw of buf.toString("utf8").split("\n")) {
                const line = raw.replace(/\r$/, "").trim();
                if (!line) continue;
                send({ kind: "line", line });
              }
            }
          } finally {
            await fh.close();
          }
        } catch (e: unknown) {
          send({ kind: "error", message: (e as Error).message ?? String(e) });
        }
      };

      pollInterval = setInterval(tick, 1000);
      void tick();
      pingInterval = setInterval(() => safeEnqueue(`: ping\n\n`), 25_000);
    },
    cancel() {
      aborted = true;
      if (pollInterval) clearInterval(pollInterval);
      if (pingInterval) clearInterval(pingInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
