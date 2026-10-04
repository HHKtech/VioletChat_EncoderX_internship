// Custom Node.js server that boots Next.js and attaches a Socket.IO server to
// the same HTTP server/port. This keeps the deployment story simple (a single
// process to run) while still giving Socket.IO the persistent, long-lived
// HTTP server it needs for WebSocket upgrades - something plain serverless
// Next.js API routes cannot provide reliably.

import "dotenv/config";

import { createServer } from "node:http";
import next from "next";
import { createSocketServer } from "./src/server/socketServer";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      handle(req, res);
    });

    createSocketServer(httpServer);

    httpServer.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`VioletChat server ready on http://localhost:${port} (${dev ? "development" : "production"})`);
    });
  })
  .catch((error: unknown) => {
    console.error("Failed to start VioletChat server", error);
    process.exit(1);
  });
