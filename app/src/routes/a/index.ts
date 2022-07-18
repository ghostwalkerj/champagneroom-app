// import NodeCouchDb from 'node-couchdb';

// /** @type {import('@sveltejs/kit').RequestHandler} */
// export async function GET() {
// 	const response = await fetch('http://localhost:5984/_session', {
// 		method: 'GET',
// 		headers: {
// 			Accept: 'application/json',
// 			'Content-Type': 'application/json; charset=utf-8',
// 			'X-Auth-CouchDB-Roles': 'users',
// 			'X-Auth-CouchDB-UserName': 'pcallUser',
// 			'X-Auth-CouchDB-Token': '6f20e22fb87c093897f0a1a1e84e5aec71c6c12b'
// 		}
// 	});
// 	const couchAuth = new NodeCouchDb({
// 		host: '192.168.1.48',
// 		protocol: 'http',
// 		port: 5984,
// 		auth: {
// 			user: 'pcallUser',
// 			pass: 'nephew-curry-stuffing'
// 		}
// 	});
// }
