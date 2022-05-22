const http = require("http");
const express = require("express");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const { setupWorker, setupMaster } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");

const entryPoint = require("./index");

// CONSTANTS

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect any DB...

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

    server.listen(PORT);

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
  } else {
    console.log({
      message: `Worker ${process.pid} started`,
      timestamp: new Date().toString(),
    });

    const io = require("socket.io")(server);

    // use the cluster adapter
    io.adapter(createAdapter());

    // setup connection with the primary process
    setupWorker(io);

    // Wrap index.js
    entryPoint.call({ io });
  }
})();
