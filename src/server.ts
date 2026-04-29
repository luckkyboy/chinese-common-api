import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { ensureDataLoaded } from "./handlers/oil-price/data-store.js";

const app = createApp(process.env);

async function bootstrap() {
  await ensureDataLoaded();

  serve(
    {
      fetch: app.fetch,
      port: config.server.port,
      hostname: config.server.host,
    },
    (info) => {
      console.log(`Server running on http://${config.server.host}:${info.port}`);
    }
  );
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap server", error);
  process.exit(1);
});
