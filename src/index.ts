import { serve } from "bun";
import index from "./index.html";
import { main } from "./agent";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/ws": (req, svr) => svr.upgrade(req) ? undefined : new Response(null, { status: 500 }),
  },

  websocket: {
    open(ws) {
      ws.subscribe("all");
    },
    message(ws, message) {
      
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

main(content => server.publish("all", content));

console.log(`🚀 Server running at ${server.url}`);
