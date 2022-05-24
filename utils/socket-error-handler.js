const {
 handleDuplicateKeyError,
 handleValidationError,
} = require("./error-formatting");

function errorHandler(err, socket) {
 try {
  switch (true) {
   case err.name === "NotFound":
    //404 Errors
    return socket.emit("updates", err);
   case err.name === "Unauthorized":
    return socket.emit("updates", err);
   case err.name === "Forbidden":
    return socket.emit("updates", err);
   case err.name === "Validation":
    return socket.emit("updates", err);
   case err.name === "ValidationError":
    //400 Errors
    return socket.emit("updates", handleValidationError(err, res));

   case err.code && err.code == 11000:
    return socket.emit("updates", handleDuplicateKeyError(err, res));
   default:
    console.log(err);
    return socket.emit("updates", { message: "Unexpected Error" });
  }
 } catch (e) {
  console.log(err);
  return socket.emit("updates", { message: "Unexpected Error" });
 }
}

module.exports = errorHandler;
