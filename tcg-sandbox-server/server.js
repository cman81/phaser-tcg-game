const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows open testing across all client ports inside your container
        methods: ["GET", "POST"]
    }
});

// --- SECURE AUTHORITATIVE ROOM MEMORY CACHE ---
const activeRooms = {}; 

/**
 * Helper to generate a secure, server-side randomized 60-card database sequence.
 */
function generateAuthoritativeDeck() {
    const prototypes = [
        { name: "Pika", atlasKey: "pikachu", type: "character" },
        { name: "Chan", atlasKey: "chandelure", type: "character" },
        { name: "Sprig", atlasKey: "sprigatito", type: "character" },
        { name: "Water", atlasKey: "water", type: "energy" },
        { name: "Fire", atlasKey: "fire", type: "energy" }
    ];
    let secureDeck = [];
    for (let i = 1; i <= 60; i++) {
        const proto = prototypes[(i - 1) % prototypes.length];
        secureDeck.push({
            id: i,
            uuid: uuidv4(),
            name: proto.name,
            atlasKey: proto.atlasKey,
            type: proto.type
        });
    }
    return secureDeck.sort(() => Math.random() - 0.5);
}

io.on('connection', (socket) => {
    // FORCE CONFIRMATION LAYER PRINT ON THE FIRST FRAME
    console.log(`[SERVER-3RD-ENTITY] New physical connection stream established: ${socket.id}`);

    /**
     * ENDPOINT: Joins a matching room pairing code and populates secure deck memories.
     */
    socket.on('JOIN_ROOM', (data) => {
        // Assume data payload now passes: { roomCode, sessionId }
        const { roomCode, sessionId } = data;
        socket.join(roomCode);
        
        if (!activeRooms[roomCode]) {
            activeRooms[roomCode] = {
                players: {},       // Maps socket.id to slot identities
                sessions: {},      // --- NEW: Maps sessionId to slot identities ---
                decks: {},
                // --- NEW: COMPREHENSIVE BOARD STATE MEMORY CHUNKS ---
                boardState: {
                    PLAYER_A: { hand: [], field: [], discard: [] },
                    PLAYER_B: { hand: [], field: [], discard: [] }
                },
                spectators: []
            };
        }

        const room = activeRooms[roomCode];

        // --- THE REHYDRATION DISCOVERY ROUTINE ---
        // Check if this specific user session was already registered in the past
        if (room.sessions[sessionId]) {
            const rehydratedSlot = room.sessions[sessionId];
            
            // Link their brand new socket.id back to their existing slot identity row
            room.players[socket.id] = rehydratedSlot;
            console.log(`[REHYDRATE] Re-linking slot ${rehydratedSlot} to new socket pipe: ${socket.id}`);

            // TRANSMIT FULL RESTORATION BACKEND DUMP EXCLUSIVELY TO THIS REFRESHED TAB
            socket.emit('STATE_REHYDRATION', {
                playerSlot: rehydratedSlot,
                deckCount: room.decks[rehydratedSlot].length,
                myBoard: room.boardState[rehydratedSlot],
                oppBoard: room.boardState[rehydratedSlot === 'PLAYER_A' ? 'PLAYER_B' : 'PLAYER_A'],
                // --- FIXED: ATTACH ABSOLUTE STATE COUNT ENVELOPE ---
                oppHandCount: room.boardState[rehydratedSlot === 'PLAYER_A' ? 'PLAYER_B' : 'PLAYER_A'].hand.length
            });
            return;
        }

        // --- STANDARD NEW PLAYER ENTRY LOGIC ---
        const playerCount = Object.keys(room.sessions).length;
        if (playerCount >= 2) {
            socket.emit('ERROR', 'This sandbox room session is already full!');
            return;
        }

        const playerSlot = playerCount === 0 ? 'PLAYER_A' : 'PLAYER_B';
        room.players[socket.id] = playerSlot;
        room.sessions[sessionId] = playerSlot; // Lock the session ID permanently
        room.decks[playerSlot] = generateAuthoritativeDeck();

        console.log(`[ROOM ${roomCode}] Assigned ${socket.id} to slot ${playerSlot}`);
        socket.emit('SESSION_ASSIGNED', { playerSlot, deckCount: room.decks[playerSlot].length });

        if (Object.keys(room.sessions).length === 2) {
            io.to(roomCode).emit('GAME_READY');
        }
    });


    /**
     * ENDPOINT: Asymmetric Draw Engine. (High vs Low privilege distribution).
     */
    socket.on('REQUEST_DRAW', (roomCode) => {
        const room = activeRooms[roomCode];
        if (!room) return;

        const playerSlot = room.players[socket.id];
        const deckStack = room.decks[playerSlot];

        if (!deckStack || deckStack.length === 0) {
            socket.emit('ERROR', 'Your backend deck list is completely exhausted!');
            return;
        }

        const realCardData = deckStack.pop();
        // Save to server cache array so it persists over page loads
        room.boardState[playerSlot].hand.push(realCardData);

        // 1. HIGH-PRIVILEGE PAYLOAD (Sent strictly to drawing player)
        socket.emit('YOUR_DRAW_RESULT', {
            cardData: realCardData,
            remainingDeckCount: deckStack.length
        });

        // 2. LOW-PRIVILEGE PAYLOAD (Relayed to opponent, obscuring card properties)
        socket.to(roomCode).emit('OPPONENT_DRAW_OCCURRED', {
            uuid: realCardData.uuid,
            remainingDeckCount: deckStack.length
        });

        // 3. OMNISCIENT BROADCAST STREAM: Give full visual clarity to spectators
        room.spectators.forEach(specId => {
            io.to(specId).emit('SPECTATOR_DRAW_LOGGED', {
                actor: playerSlot,
                cardData: realCardData,
                remainingDeckCount: deckStack.length
            });
        });
    });

    /**
     * ENDPOINT: Dumb Relay Router for open sandbox tabletop coordinate placements.
     */
    socket.on('BROADCAST_MOVE', (roomCode, movePayload) => {
        const room = activeRooms[roomCode];
        if (room) {
            const playerSlot = room.players[socket.id];
            
            // Update the server's mirror of where cards are resting
            // This is just a running array log of active components on screen
            room.boardState[playerSlot].field = room.boardState[playerSlot].field.filter(c => c.uuid !== movePayload.uuid);
            room.boardState[playerSlot].field.push(movePayload);
        }
        socket.to(roomCode).emit('OPPONENT_MOVE_OCCURRED', movePayload);
    });

    /**
     * ENDPOINT: Dumb Relay Router for damage modifications and structural counter toggles.
     */
    socket.on('BROADCAST_DAMAGE', (roomCode, damagePayload) => {
        socket.to(roomCode).emit('OPPONENT_DAMAGE_MUTATED', damagePayload);
    });

    /**
     * ENDPOINT: Enrolls an audience member to view full asymmetrical card fields.
     */
    socket.on('JOIN_AS_SPECTATOR', (roomCode) => {
        const room = activeRooms[roomCode];
        if (!room) {
            socket.emit('ERROR', 'That sandbox room session does not exist yet!');
            return;
        }

        socket.join(roomCode);
        room.spectators.push(socket.id);
        console.log(`[ROOM ${roomCode}] Omniscient spectator connected: ${socket.id}`);

        socket.emit('SPECTATOR_STATE_SYNC', {
            playerADeck: room.decks['PLAYER_A'] || [],
            playerBDeck: room.decks['PLAYER_B'] || [],
        });
        
        socket.to(roomCode).emit('SPECTATOR_JOINED', { count: room.spectators.length });
    });

    /**
     * DISCONNECT CLEANUP LOOP RECYCLER
     */
    socket.on('disconnect', () => {
        for (const roomCode in activeRooms) {
            const room = activeRooms[roomCode];
            if (room.players[socket.id]) {
                const identity = room.players[socket.id];
                console.log(`[SERVER] ${identity} unlinked stream session: ${socket.id}`);
                delete room.players[socket.id];
                
                if (Object.keys(room.players).length === 0) {
                    delete activeRooms[roomCode];
                } else {
                    io.to(roomCode).emit('OPPONENT_DISCONNECTED');
                }
                break;
            }
        }
    });

    /**
     * ENDPOINT: Compiles and returns raw deck content data to the requesting slot.
     * High-privilege inquiry strictly for local Deck Browser modal tracking layers.
     */
    socket.on('REQUEST_DECK_CONTENT', (roomCode) => {
        const room = activeRooms[roomCode];
        if (!room) return;

        const playerSlot = room.players[socket.id];
        const secureDeckList = room.decks[playerSlot] || [];

        // Return the full array list back down strictly to the inquiring client
        socket.emit('DECK_CONTENT_RESULT', { deckList: secureDeckList });
    });

    /**
     * ENDPOINT: Securely shuffles a player's hidden data stack on the server.
     * Randomizes array index bounds and broadcasts confirmation status down to both client tabs.
     */
    socket.on('REQUEST_DECK_SHUFFLE', (roomCode) => {
        const room = activeRooms[roomCode];
        if (!room) return;

        const playerSlot = room.players[socket.id];
        const deckStack = room.decks[playerSlot];

        if (!deckStack || deckStack.length === 0) return;

        // 1. Execute secure server-side array shuffle pass
        room.decks[playerSlot] = deckStack.sort(() => Math.random() - 0.5);
        console.log(`[ROOM ${roomCode}] Server securely re-shuffled deck for: ${playerSlot}`);

        // 2. Broadcast a universal confirmation notification frame down to BOTH players
        // Using io.to(roomCode).emit to sync everyone on the board simultaneously
        io.to(roomCode).emit('SERVER_SHUFFLE_CONFIRMED', {
            actor: playerSlot,
            remainingCount: room.decks[playerSlot].length
        });
    });

});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Real-Time TCG Sandbox Server online at http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});
