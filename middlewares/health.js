module.exports = (NameSpace) => {
 console.log(
  `${process.pid} has ${NameSpace.sockets.clients().length} connections`
 );
};
