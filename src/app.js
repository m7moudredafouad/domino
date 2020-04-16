const http = require('http')
const express = require('express')
const path = require('path')

const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const xss = require('xss-clean')
const hbs = require('hbs')
const cookieParser = require('cookie-parser')
const socketio = require('socket.io')

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('Uncaught Exception Shutting down')
    process.exit(1)
})


const viewRouter = require('./routes/viewRoutes')

const app = express();
const server = http.createServer(app)
const io = socketio(server)

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, '../templates/views'))
hbs.registerPartials(path.join(__dirname, '../templates/partials'))

// Serving static files
app.use(express.static(path.join(__dirname, '../public')))

// Security HTTP headers
app.use(helmet())

app.use(express.json({limit: '10kb'}));   // This is a middleware
app.use(cookieParser())


//Data Sanitization against XSS
app.use(xss())

// Limit rate od requests
const limiter = rateLimit({
    max: 100,
    windowMs: 60*60*1000,
    message: 'Too many requests, Please try again in an hour'
})
app.use('/', limiter)

const {addRoom, getRooms, removeRoom} = require('./models/rooms')
const {addUser, removeUser, findUser, findUsersInRoom} = require('./models/users')

app.use(viewRouter)

io.on('connection', (socket) => {

    socket.on('join', ({room, name}) => {
        let users = findUsersInRoom(room);
        console.log(users.length)
        if(users.length > 1){
            socket.emit('disconnect')
        } else {

            socket.join(room)
            
            addRoom(room)
            const index = users.length || 0
            
            // let user = addUser({id: socket.id, username:`Player${socket.id}`, room})
            let user = addUser({
                socketId: socket.id,
                id: index,
                username: name || 'unknown',
                room})
                
                users = findUsersInRoom(room)
                
                socket.emit('setId', {myId: socket.id})
                io.to(user.room).emit('players', (users))
        }
    })
    

    socket.on('distrbuteCards', ({PlayerCards, remainCards, toPlayOn}) => {
        const user = findUser(socket.id)
        io.to(user.room).emit('updatePlayersCards', ({PlayerCards, remainCards, toPlayOn}))
        io.to(user.room).emit('updateUICards', (PlayerCards))
    })
    
    socket.on('updateCards', ({PlayerCards, remainCards}) => {
        const user = findUser(socket.id)
        io.to(user.room).emit('updatePlayersCards', ({PlayerCards, remainCards}))
    })


    socket.on('changeTurn', (newturn) => {
        const user = findUser(socket.id)
        socket.broadcast.to(user.room).emit('changeTurn', newturn)
    })

    // socket.on('updateMyCards', ({PlayerCards, remainCards}) => {
    //     const user = findUser(socket.id)
    //     io.to(user.room).emit('updateEnemyCards', ({PlayerCards, remainCards}))
    // })
    
    socket.on('updateToPlayOn', (toPlayOn) => {
        const user = findUser(socket.id)
        io.to(user.room).emit('toPlayOn', toPlayOn)
    })
    
    socket.on('played', ({whereToPlay, newCard, newCards}) => {
        const user = findUser(socket.id)
    
        socket.broadcast.to(user.room).emit('enemyPlayed', ({whereToPlay, newCard, newCards}))
    })

    socket.on('winner', ({winner, players}) => {
        const user = findUser(socket.id)
        io.to(user.room).emit('winner', ({winner, players}))
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            console.log(user)
            socket.broadcast.to(user.room).emit('playerLeft', (user))
        }
    })

})

// app.all('*', (req, res, next) => {
//     next('Error page not found');
// })


const port = process.env.PORT;
const serverApp = server.listen(port, () => {
    console.log(`Server is up on ${port}`)
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('Unhandled Rejection Shutting down')
    serverApp.close(() => {
        process.exit(1)
    })
})
