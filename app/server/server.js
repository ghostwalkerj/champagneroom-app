import GUN from 'gun';
import http from 'http';

const server = http.createServer().listen(8080);
const gun = GUN({ file: 'data', web: server });
