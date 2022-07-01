
import { PeerServer } from 'peer';


const peerServer = PeerServer({ port: 8000, path: '/' }, (server) => {
  const address = server.address();
  console.log(`Server is running on port: ${address.port}`);
});


peerServer.on('connection', (id) => {
  console.log('connection: ', id);
});