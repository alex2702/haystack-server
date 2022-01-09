/**
 * IMPORTANT: 
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 * 
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options 
 *
import { listen } from "@colyseus/arena";

// Import arena config
import arenaConfig from "./arena.config";

// Create and listen on 2567 (or PORT environment variable.)
listen(arenaConfig);
*/

// Colyseus + Express
import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { monitor } from "@colyseus/monitor";
import { HaystackRoom } from "./rooms/HaystackRoom";

const port = Number(process.env.port) || 2567;

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
    res.send("");
});
app.use("/colyseus", monitor());

const gameServer = new Server({
    server: createServer(app)
});

gameServer.define('haystack_room', HaystackRoom);

// DEVELOPMENT ONLY
if (process.env.NODE_ENV !== "production") {
    // simulate 200ms latency between server and client.
    gameServer.simulateLatency(200);
}

gameServer.listen(port);