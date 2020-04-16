const rooms = []

// addRoom, removeRoom, getRooms

const addRoom = (room) => {
    room.trim().toLowerCase()
    
    if(!rooms.includes(room)){
        rooms.push(room);
    }
    
}


const getRooms = () => {
    return rooms;
}


const removeRoom = (room) => {
    const roomIndex = rooms.findIndex((roomm) =>{
        return roomm === room
    })


    if(roomIndex !== -1) {
        rooms.splice(roomIndex, 1)
    }

}



module.exports = {
    addRoom,
    getRooms,
    removeRoom,
}