const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { ROLES } = require('../constants');
const keys = require('../config/keys');
const User = mongoose.model('User');

const support = require('./support');

// Verifies the JWT sent during the socket handshake (`socket.handshake.auth.token`,
// as `Bearer <token>` — same token format/secret as the REST API) and, on
// success, registers the connecting user in support.js's in-memory user list
// so the live support-chat feature knows who's online. Runs once per
// connection attempt via `io.use(authHandler)` below, before 'connection' fires.
const authHandler = async (socket, next) => {
  const { token = null } = socket.handshake.auth;
  if (token) {
    const [authType, tokenValue] = token.trim().split(' ');
    if (authType !== 'Bearer' || !tokenValue) {
      return next(new Error('no token'));
    }

    const { secret } = keys.jwt;
    const payload = jwt.verify(tokenValue, secret);
    const id = payload.id.toString();
    const user = await User.findById(id);

    if (!user) {
      return next(new Error('no user found'));
    }

    const u = {
      id,
      role: user?.role,
      isAdmin: user.role === ROLES.Admin,
      name: `${user?.firstName} ${user?.lastName}`,
      socketId: socket.id,
      messages: []
    };

    const existingUser = support.findUserById(id);
    if (!existingUser) {
      support.users.push(u);
    } else {
      existingUser.socketId = socket.id;
    }
  } else {
    return next(new Error('no token'));
  }

  next();
};

// Attaches Socket.IO to the same HTTP server the Express app listens on
// (see server/index.js), powering the real-time member<->admin support chat.
const socket = server => {
  const io = socketio(server, {
    // Wide open — accepts socket connections from any origin.
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(authHandler);

  const onConnection = socket => {
    support.supportHandler(io, socket);
  };

  io.on('connection', onConnection);
};

module.exports = socket;
