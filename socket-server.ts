// socket-server.ts
import "dotenv/config";
import { createServer } from "node:http";
import { createSocketServer } from "./src/server/socketServer";

const port = Number(process.env.PORT ?? 4000);

// Sirf pure HTTP server banaya, Next.js load nahi kiya
const httpServer = createServer();

// Aapka apna original socket logic attach kar diya
createSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`Standalone Socket.IO server running on port ${port}`);
});