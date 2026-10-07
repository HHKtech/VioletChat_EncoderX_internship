// socket-server.ts
import { createServer } from "node:http";
import { createSocketServer } from "./src/server/socketServer";

const port = Number(process.env.PORT || 4000);
const httpServer = createServer();

createSocketServer(httpServer);

// Explicitly bind to 0.0.0.0 so Alwaysdata's reverse proxy can reach it
httpServer.listen(port, "::", () => {
  console.log(`Standalone Socket.IO server running on port ${port}`);
});