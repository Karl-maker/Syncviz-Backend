const http = require("http");
const express = require("express");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const { setupWorker, setupMaster } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
const redis = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const entryPoint = require("./index");
const config = require("./config");

// CONSTANTS

const app = express();
const server = http.createServer(app);
const PORT = config.server.PORT;
const REDIS_URL = config.redis.URL;
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

// Connect any DB...

require("./helper/db")();

(async function () {
 if (cluster.isMaster) {
  console.log({
   message: `Master ${process.pid} is running`,
   timestamp: new Date().toString(),
  });
  const httpServer = http.createServer();

  // setup sticky sessions
  setupMaster(server, {
   loadBalancingMethod: "least-connection",
  });

  // setup connections between the workers
  setupPrimary();

  // needed for packets containing buffers (you can ignore it if you only send plaintext objects)
  // Node.js < 16.0.0
  cluster.setupMaster({
   serialization: "advanced",
  });

  //server.listen(PORT);

  for (let i = 0; i < numCPUs; i++) {
   cluster.fork();
  }

  cluster.on("exit", (worker) => {
   console.log({
    message: `Worker ${worker.process.pid} died`,
    timestamp: new Date().toString(),
   });
   cluster.fork();
  });

  setInterval(function () {
   const used = process.memoryUsage();

   const msg = {};

   for (let key in used) {
    msg[`${key}`] = `${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`;
   }

   console.log(msg);
  }, 10000);
 } else {
  console.log({
   message: `Worker ${process.pid} started`,
   timestamp: new Date().toString(),
  });

  const io = require("socket.io")(server, {
   cors: {
    origin: "*",
    methods: ["GET", "POST"],
   },
  });

  // use the cluster adapter

  io.adapter(createAdapter());

  // setup connection with the primary process
  setupWorker(io);

  // Wrap index.js

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
   io.adapter(redis.createAdapter(pubClient, subClient));

   setInterval(
    () =>
     console.log({
      pid: process.pid,
      connections: io.engine.clientsCount,
     }),
    10000
   );

   entryPoint.call({ io });
   io.listen(PORT);
  });
 }
})();
