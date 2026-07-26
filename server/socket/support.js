const uuidv4 = require('uuid').v4;

// All state here is in-memory and process-local: connected users and chat
// history are lost on server restart, and this wouldn't work correctly
// behind multiple server instances (each would have its own disconnected
// copy of `users`/`messages`). There's no database persistence for support
// chat at all.
const users = [];
const messages = [];

const findUserById = id => users.find(x => x.id === id);
const findUserBySocketId = socketId => users.find(x => x.socketId === socketId);

const updatedUserStatus = (user, status) => {
  const existingUser = findUserById(user.id);
  if (existingUser) {
    existingUser.online = status;
  }
};

// Wires up all support-chat socket events for one connected client. Called
// once per connection from socket/index.js's `onConnection` handler.
exports.supportHandler = (io, socket) => {
  socket.on('connectUser', async () => {
    const user = findUserBySocketId(socket.id);

    /*
      if user connected is admin => notify everyone
      if user connected is not admin => notify all admins
    */
    if (user) {
      user.online = true;
      if (user.isAdmin) {
        socket.broadcast.emit('connectUser', user);
      } else {
        const admins = users.filter(
          x => x.isAdmin === true && x.online === true
        );
        admins.map(admin =>
          socket.to(admin.socketId).emit('connectUser', user)
        );
      }
    }
  });

  // An admin gets the full contact list (everyone else); a regular member
  // only ever sees admins to chat with — not other members.
  socket.on('getUsers', async () => {
    const user = findUserBySocketId(socket.id);
    const notMe = users.filter(x => x.socketId !== socket.id);
    const adminUsers = users.filter(x => x.isAdmin === true);
    const userDocs = user?.isAdmin ? notMe : adminUsers;
    io.to(socket.id).emit('getUsers', userDocs);
  });

  socket.on('getMessages', () => {
    const user = findUserBySocketId(socket.id);
    const sentMsgs = messages.filter(m => m.from === user?.id);
    const receivedMsgs = messages.filter(m => m.to === user?.id);
    io.to(socket.id).emit('getMessages', [...sentMsgs, ...receivedMsgs]);
  });

  socket.on('message', body => {
    const { text, to } = body;
    const user = findUserBySocketId(socket.id);
    const userTo = findUserById(to);

    const message = {
      id: uuidv4(),
      value: text,
      time: Date.now(),
      user: user,
      from: user.id,
      to: userTo?.id
    };

    messages.push(message);
    // Emits to both the sender and the recipient's socket, so the sender's
    // own open chat window updates immediately too.
    io.to(userTo.socketId).to(user.socketId).emit('message', message);
  });

  socket.on('disconnect', async () => {
    const user = findUserBySocketId(socket.id);
    if (user) {
      updatedUserStatus(user, false);
      user.online = false;
      socket.broadcast.emit('disconnectUser', user);
    }
  });

  // Unreachable on a server-side socket: 'connect_error' is a client-side
  // concept (fired on the client's Socket when a connection attempt
  // fails), and socket.io reserves the name — a server-side Socket refuses
  // to ever emit it (see RESERVED_EVENTS in socket.io's socket-types.js).
  // This looks like a client-side error-handling pattern applied here by
  // mistake; left as-is since removing it isn't this task's concern.
  /* istanbul ignore next */
  socket.on('connect_error', err => {
    console.log(`connect_error due to ${err.message}`);
  });
};

exports.users = users;
exports.findUserById = findUserById;
