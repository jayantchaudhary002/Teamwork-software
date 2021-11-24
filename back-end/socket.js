const { io } = require('./app');

let activeUserConnections = [];
let awayUserConnections = [];
let awayUserIds = [];
const socketListener = io.on('connect', socket => {
    socket.on('message', message => {
        console.log(message);
    });
    socket.on('activeUser', activeUser => {

        if (activeUser.userId && activeUser.clientSocket) {
            if (
                awayUserConnections.some(({ userId }) => {
                    return userId === activeUser.userId;
                }) ||
                awayUserIds.indexOf(activeUser.userId) !== -1
            ) {
                awayUserConnections = awayUserConnections.concat(activeUser);
            } else {
                activeUserConnections = activeUserConnections.concat(activeUser);
            }
        }
        io.emit('updateUserActivity', activeUserConnections);
    });

    socket.on('setAwayUser', awayUser => {
        if (awayUser.userId && awayUser.clientSocket) {
            awayUserIds = awayUserIds.concat(awayUser.userId);

            awayUserConnections = awayUserConnections.concat(
                activeUserConnections.filter(({ userId }) => {
                    return userId === awayUser.userId;
                }),
            );

            activeUserConnections = activeUserConnections.filter(({ userId }) => {
                return userId !== awayUser.userId;
            });
        }

        io.emit('updateUserActivity', activeUserConnections);
    });

    socket.on('setActiveUser', activeUser => {
        if (activeUser.userId && activeUser.clientSocket) {
            activeUserConnections = activeUserConnections.concat(
                awayUserConnections.filter(({ userId }) => {
                    return userId === activeUser.userId;
                }),
            );

            awayUserConnections = awayUserConnections.filter(({ userId }) => {
                return userId !== activeUser.userId;
            });

            awayUserIds = awayUserIds.filter(userId => {
                return userId !== activeUser.userId;
            });
        }

        io.emit('updateUserActivity', activeUserConnections);
    });

    socket.on('joinChannel', ({ currentChannelID, allChannelIDs }) => {
        const rooms = Object.keys(socket.rooms);

        socket.join(currentChannelID, () => {
            if (allChannelIDs) {
                rooms.forEach(room => {
                    if (room !== currentChannelID && allChannelIDs.indexOf(room) !== -1) socket.leave(room);
                });
            }
        });
    });

    socket.on('joinThread', commentID => {
        socket.join(commentID);
    });

    socket.on('leaveThread', commentID => {
        socket.leave(commentID);
    });

    socket.on('post_thread', thread => {
        socket.broadcast.to(thread.commentid).emit('post_threadBody', thread);
        socket.broadcast.to(thread.channelID).emit('post_thread', thread);
    });

    socket.on('edit_thread', data => {
        socket.broadcast.to(data.parentID).emit('edit_threadBody', data);
        socket.broadcast.to(data.channelID).emit('edit_thread', data);
    });

    socket.on('delete_thread', data => {
        socket.broadcast.to(data.parentID).emit('delete_threadBody', data);
        socket.broadcast.to(data.channelID).emit('delete_thread', data);
    });

    socket.on('disconnect', reason => {
        activeUserConnections = activeUserConnections.filter(({ clientSocket }) => {
            return clientSocket != socket.id;
        });

        awayUserConnections = awayUserConnections.filter(({ clientSocket }) => {
            return clientSocket != socket.id;
        });

        io.emit('updateUserActivity', activeUserConnections);

        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });

    socket.on('error', error => {
        console.log(error);
    });
});

module.exports = socketListener;
