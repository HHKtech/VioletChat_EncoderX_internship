// socket-server.ts
import { createServer } from "node:http";
import { createSocketServer } from "./src/server/socketServer";

// Alwaysdata ka system PORT pehle preference le, local fallback 4000 rahe
const port = Number(process.env.PORT || 4000);

const httpServer = createServer();

createSocketServer(httpServer);

// Alwaysdata reverse proxy ke liye "0.0.0.0" binding
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Standalone Socket.IO server running on port ${port}`);
});