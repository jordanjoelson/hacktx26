import { config } from "./config";
import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { describeContent, handleInbound } from "./handler";
import { startDeliveries } from "./subscribers";

const app = await Spectrum({
  projectId: config.PHOTON_PROJECT_ID,
  projectSecret: config.PHOTON_PROJECT_SECRET,
  providers: [imessage.config()],
});

// Per-sender promise chains: each sender's messages run in order,
// while different senders run concurrently.
const queues = new Map<string, Promise<void>>();

function enqueue(key: string, task: () => Promise<void>): void {
  const tail = (queues.get(key) ?? Promise.resolve()).then(task);
  queues.set(key, tail);
  void tail.finally(() => {
    if (queues.get(key) === tail) queues.delete(key);
  });
}

let stopping = false;

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  console.log(`Received ${signal}, shutting down…`);
  try {
    await app.stop();
  } catch (err) {
    console.error("Error during shutdown:", err);
  }
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

console.log("Lately is listening…");
startDeliveries(app);

for await (const [space, message] of app.messages) {
  if (message.direction !== "inbound") continue;

  const sender = message.sender?.id ?? "unknown";
  console.log(`${new Date().toISOString()} ${sender} ${describeContent(message.content)}`);

  enqueue(sender, async () => {
    try {
      await handleInbound(app, space, message);
    } catch (err) {
      console.error(`Error handling message ${message.id} from ${sender}:`, err);
    }
  });
}

if (!stopping) {
  console.error("Message stream ended unexpectedly; exiting so the process restarts.");
  process.exit(1);
}
