const {addRoom, removeRoom, getRooms} = require('./rooms')
const users = []

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({socketId, id, username, room}) => {

    username.trim().toLowerCase();
    room.trim().toLowerCase();

    // Validate the data
    if(!username || !room) {
        return {
            error: 'Sorry you must provide you username and the room'
        }
    }


    const existingUser = users.findIndex((user) => {
        return user.room == room && user.username == username
    })

    if(existingUser !== -1) {
        return {
            error: 'Username is taken in the room please choose another one'
        }
    }

    const user = {socketId, id, username, room}

    users.push(user)

    return user
}

const findUsersInRoom = (room) => {
    const usersInRoom = users.filter((user) => {
        return user.room === room
    })

    if(usersInRoom.length === 0){
        removeRoom(room)
        // return {
        //     error: `We didn't find the users in ${room}`
        // }
        return 0;
    }

    return usersInRoom;
}


const findUser = (socketId) => {
    const userIndex = users.findIndex((user) => {
        return user.socketId === socketId
    })

    if(userIndex === -1){
        return {
            error: 'We didn\'t find the user'
        }
    }

    return users[userIndex]
}


const removeUser = (socketId) => {
    const userIndex = users.findIndex((user) => {
        return user.socketId === socketId
    })
    
    
    if(userIndex !== -1){
        const room = users[userIndex].room

        if(findUsersInRoom(room).length === 1) {
            removeRoom(room)
        }
        


        return users.splice(userIndex, 1)
    }
    

}



module.exports = {
    addUser,
    removeUser,
    findUser,
    findUsersInRoom
}