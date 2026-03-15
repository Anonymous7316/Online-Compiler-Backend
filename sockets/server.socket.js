import { Server } from 'socket.io';


function initializeSocketServer(httpServer){
    try{
        const io = new Server(httpServer, {
            cors: {
                origin: "*",
                credentials: true
            }
        });
        console.log('WebSocket server initialized.');
        io.on('connection', (socket) => {
            console.log('A client connected: ' + socket.id);
        });
    }
    catch(err){
        console.error('Error initializing WebSocket server:', err);
    }
}

export function connectToSocketServer(httpServer) {
    let io;

    if (!io){
        initializeSocketServer(httpServer);
    }
    
    return io;
}
