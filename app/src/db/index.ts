import Gun from 'gun';

export const gun = Gun({
	peers: ['http://localhost:8080/gun'] // Put the relay node that you want here
});
