
import { PeerServer } from 'peer';


const peerServer = PeerServer({ port: 8000, path: '/' }, (server) => {
  const address = server.address();
  console.log(`Server is running on port: ${address.port}`);
});


peerServer.on('connection', (client) => {
  console.log('connection: ', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('disconnect: ', client.getId());
});
