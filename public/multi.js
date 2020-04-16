let socket = io()
// socket.emit('join', {room: location.search.split('=')[1]});
socket.emit('join', {
    room: document.getElementById('room').value,
    name: document.getElementById('name').value
});



// Game Controller
const gameController = (function () {
    // Code
    let data = {
        startedGame: true,
        players: [],
        ids:[],
        myId: Number,
        allCards:[],
        toPlayOn: [],
        whoseTurn: String,
    }

    socket.on('setId', ({myId}) => {
        data.myId = myId
    })

    socket.on('players', (users) => {
        data.players = []
        users.forEach((user) => {
            data.players.push({...user, cards:[], cardSum: 0, score:0})
        })

        data.ids = []
        
        data.players.forEach((player) => {
            data.ids.push(player.socketId)
        })

        data.whoseTurn = data.ids[0]

        
        socket.emit('updateCards', ({PlayerCards: data.players, remainCards:data.allCards}))
    })

    socket.on('playerLeft', (user) => {
        let index = data.players.findIndex((player) => {
            return player.socketId == user.socketId
        })
        data.players.splice(index, 1)

        
        socket.emit('updateCards', ({PlayerCards: data.players, remainCards:data.allCards}))
    })
    
    socket.on('updatePlayersCards', ({PlayerCards, remainCards, toPlayOn}) => {
        if(PlayerCards != undefined) data.players = PlayerCards
        if(toPlayOn) data.toPlayOn = toPlayOn
        data.allCards = remainCards
    })

    socket.on('toPlayOn', (toPlayOn) => {
        data.toPlayOn = toPlayOn
    })

    socket.on('changeTurn', (newTurn) => {
        changeTurnFunc(newTurn)
    })

    const changeTurnFunc = (newTurn) => {
        // data.whoseTurn = data.whoseTurn == 1 ? 2 : 1;

        data.whoseTurn = data.ids[newTurn];

    }

    const giveCards = (toPutIn, numCards) => {
        let taken;
        let cardsLen = data.allCards.length

        // if(cardsLen == 1){
            // if (!data.toPlayOn.includes(data.allCards[0][0]) && data.toPlayOn.includes(data.allCards[0][1])) changeTurnFunc()
        // }
        if(cardsLen < 1) return;

        for(let i = 0; i < numCards; i++){
            cardsLen = data.allCards.length

            let random = Math.floor(Math.random() * cardsLen)

            taken = data.allCards.splice(random, 1)[0]

            toPutIn.push([taken[0], taken[1]])
        }

        return taken;
    }
    
    const removeCard = (removeFrom, card) => {
        let index =  removeFrom.findIndex((item)=> {
            return ((item[0] == card[0]) && (item[1] == card[1])) || ((item[0] == card[1]) && (item[1] == card[0]))
        })
        if(index == -1){
            console.log(card, 'not found in ', removeFrom)
            return;
        }
        removeFrom.splice(index, 1)
    }

    const find = (id = data.myId) => {
        const index = data.players.findIndex((player) => {
            return player.socketId == id
        })
        return index;
    }

    const playCardFunc = (card) => {
        let index,
            places = ['left', 'right']
        
            let myIndex = find()

        if(data.toPlayOn.length == 0) {
            data.toPlayOn = card
            
            // removeCard(data.players[data.myId].cards, card)
            removeCard(data.players[myIndex].cards, card)
            
            socket.emit('updateToPlayOn', data.toPlayOn)
            
            return {
                whereToPlay:places[0],
                newCard: card,
                winner: checkWinner()
            };
            
        }
        
        if(data.toPlayOn[0] == card[0] && data.toPlayOn[1] == card[1]){
            index = prompt('Left or right ?\n left (0) \n right (1)')

        } else if(data.toPlayOn[0] == card[1] && data.toPlayOn[1] == card[0]){
            index = prompt('Left or right ?\n left (0) \n right (1)')
            
        } else if(card.includes(data.toPlayOn[0])){
            index =  0
        } else if(card.includes(data.toPlayOn[1])){ 
            index = 1
        } else { 
            // checkWinner()
            return false;
         }
        
        index = index / index || index / 1;
        const newCard = updateToPlayOn(index, card)

        removeCard(data.players[myIndex].cards, card)

        return {
            whereToPlay:places[index],
            newCard,
            winner : checkWinner()
        }
    }

    const searchforCards = (searchIn) => {
        let availableLeft = [], availableRight = []

        if(data.toPlayOn.length == 0){
            availableRight= searchIn;
            availableLeft= searchIn;

            return {
            availableLeft,
            availableRight,
            leftLen: availableLeft.length,
            rightLen: availableRight.length
            }
        }


        let leftPlay = data.toPlayOn[0]
        let rightPlay = data.toPlayOn[1]
        
        
        availableLeft = searchIn.filter((item) => {
            return item.includes(leftPlay)
        });
        
        availableRight = searchIn.filter((item) => {
            return item.includes(rightPlay)
        });

        
        return {
            availableLeft,
            availableRight,
            leftLen: availableLeft.length,
            rightLen: availableRight.length
        }
    }

    const checkAfterremainCardsZero = () =>  {
        let message = '';
        if(data.allCards.length == 0){
            let noPlay = 1;
            
            data.players.forEach((player) => {
                let playerCardLen = searchforCards(player.cards)

                noPlay = (noPlay == 0 ) && (playerCardLen.leftLen == 0) && (playerCardLen.rightLen == 0)
            })
            
            console.log(`noPlay: ${noPlay}`)
            if(noPlay){
                data.players.sort((a, b) => {
                    if(a.cardSum < b.cardSum) return 1;
                    return -1;
                })
                return message = `${data.players[0].username} Won with ${data.players[0].cardSum}`
                
            }

            if(message == ''){
                // data.players.forEach((player) => {
                let myIndex = find();
                let playerCardLen = searchforCards(data.players[myIndex].cards)
                
                if(playerCardLen.leftLen == 0 && playerCardLen.rightLen == 0){
                    // data.whoseTurn = (data.whoseTurn -1) * -1
                    let index = data.ids.findIndex((id) => {
                        return id == data.myId
                    })
                    
                    let nextTurn = (index -1) * -1
                    changeTurnFunc(nextTurn)
                    socket.emit('changeTurn', nextTurn)
                    console.log('I Changed turn to', data.whoseTurn)
                }
                // })
            }


        }

        return message != '' ? message: false;

    }

    const checkWinner = () => {
        data.startedGame = false;
        let message, winnerIndex = -1;

        data.players.forEach((player, index) => {
            if(player.cards.length == 0) {return winnerIndex = index}

            player.cardSum = player.cards.flat(Infinity)

            player.cardSum = player.cardSum.reduce((a, b) => {return a+b})

            
        })

        if(winnerIndex > -1){
            let score = 0;
            data.players.forEach((player) => {
                score += player.cardSum
            })

            let winner = data.players[winnerIndex];

            score = score - winner.cardSum;
            winner.score += score

            return message = `${winner.username} Won with ${score}`
        }

        if(message) {
            return message
        } else {   
            const checked = checkAfterremainCardsZero();
            
            checked ? console.log(checked): '';
            
            data.startedGame = true;
            return checked;
        }
    }
    
    /**
     * 
     * @param {The index of the toPlayOn} index 
     * @param {The Card} card 
     */
    const updateToPlayOn = (index, card) => {

        const cardIndex = card.findIndex((num) => {
            return num === data.toPlayOn[index]
        })

        const newCardIndex = -1 * (cardIndex-1)
        
        let oldCard = [];
        oldCard.push(...data.toPlayOn)

        data.toPlayOn[index] = card[newCardIndex]
        /**
         * if index = 0   left
         * if index = 1   right
         */

        socket.emit('updateToPlayOn', data.toPlayOn)

        if(card[index] === oldCard[index]){
            // We will play on left
            card = card.reverse()
        }

        
        return card
    }

    return {
        newGame() {
            let i,j;
            // Empty Player Cards
            data.players.forEach((player) => {
                player.cards = [];
            })
            data.allCards = []; 
            data.toPlayOn = [];
            data.startedGame = true;

            // Create Cards
            for (i = 0; i<7; i++){
                for(j=0; j<=i; j++){
                    data.allCards.push([i, j])
                }
            }


            // Begin Pushing Cards to players
            data.players.forEach((player) => {
                giveCards(player.cards, 7)
            })

            socket.emit('distrbuteCards', ({PlayerCards: data.players, remainCards:data.allCards, toPlayOn: data.toPlayOn}))

        },

        getAllData(){
            return {
                cards: data.allCards,
                players: data.players,
                myId: data.myId,
                ids: data.ids,
                toPlayOn: data.toPlayOn,
                turn: data.whoseTurn,
                PScore: data.playerScore,
                AScore: data.AIScore,
                startedGame: data.startedGame
            }
        },

        setPlayers(id, newData) {
            const index = find(id);
            data.players[index].cards = newData
        },
        setAllPlayers(newPlayers) {
            data.players = newPlayers
        },

        pushCardToPlayer(){
            const myIndex = find()

            const{leftLen, rightLen} = searchforCards(data.players[myIndex].cards)
            console.log(leftLen, rightLen,data.toPlayOn)


            console.log('I have ', data.players[myIndex].cards)

            if(leftLen == 0 && rightLen == 0){
                let card = giveCards(data.players[myIndex].cards, 1)

                socket.emit('updateCards', ({PlayerCards: undefined, remainCards:data.allCards}))
                socket.emit('played', ({whereToPlay: undefined, newCard: undefined, newCards: data.players[myIndex].cards}))
                return card;
            }
            return;
        },

        playCard(card, notAITurn) {
            return playCardFunc(card, notAITurn)
        },

        changeTurn(newTurn) {
            return changeTurnFunc(newTurn)
        },

        getMeAndEnemy() {
            let players = data.players;
            let me, enemy;
            players.forEach((player) => {
                // if(player.id == data.myId){
                if(player.socketId == data.myId){
                    me = player;
                } else {
                    enemy = player
                }
            })

            return {
                me,
                enemy
            }
        }
    }
})();

// UI Controller
const UIController = (function(){
    // Code
    const DOMVars = {
        newGame: '#start',
        getCard: '#getCard',
        card: '#card',
        container: '.cont',
        playGround: '.playGround',
        remain: '.remain',
        AICards: '.AICards',
        score: '.score'
    }
    let container = document.querySelector(DOMVars.container);
    let playGround = document.querySelector(DOMVars.playGround);
    let remain = document.querySelector(DOMVars.remain);
    let AICards = document.querySelector(DOMVars.AICards);
    let score = document.querySelector(DOMVars.score);

    const createCard = (card, type = 'H', small = false, dotClass = 'dot') => {
        let i;
            let el = document.createElement('div')
            el.className = `${type}domino ${small ? `${type}domino__small` : ''}`
            el.setAttribute('data-card', `${card[0]} ${card[1]}`);

            let left = document.createElement('div')
            left.className = `${type}domino__left`

            let right = document.createElement('div')
            right.className = `${type}domino__right`

            let dot;

            for(i = 0; i < card[0]; i++){  // Left
                dot = document.createElement('div')
                dot.className = dotClass
                dot.setAttribute('data-card', `${card[0]} ${card[1]}`);
                left.appendChild(dot)
            }

            for(i = 0; i < card[1]; i++){  // Right
                dot = document.createElement('div')
                dot.className = dotClass
                right.appendChild(dot)
            }
            left.setAttribute('data-card', `${card[0]} ${card[1]}`);
            right.setAttribute('data-card', `${card[0]} ${card[1]}`);
            el.appendChild(left)
            el.appendChild(right)
            return el;
    }

    return{
        emptyContainer() {
            container.innerHTML = ''
            playGround.innerHTML = ''
        },

        createNewCard(card) {
            const el = createCard(card, 'V', false, 'dot');
            el.id = 'card'
            container.appendChild(el)
        },

        cardToPlayGround(card, whereToPlay){
            let el;

            if(card[0] == card[1]){
                el = createCard(card, 'V', true, 'dot__small');
            } else {
                el = createCard(card, 'H', true, 'dot__small');
            }

            if(whereToPlay == 'left') {
                playGround.insertBefore(el, playGround.firstElementChild)
            } else {
                playGround.appendChild(el)
            }
            
        },
        
        removeCard(cardEl){
            cardEl.parentNode.removeChild(cardEl)
        },

        getDOMVars(){
            return DOMVars;
        },

        getAllCards(){
            const cards = document.querySelectorAll(DOMVars.card);

            return {
                cards,
                cardsLen: cards.length
            }
        },
        clearScores(){
            score.innerHTML = '';
        },

        updateScores(player) {
            const el = document.createElement('div')
            el.textContent = `${player.username}: ${player.score}`
            score.append(el)
        },
        
        updateRemain(num){
            let html = '<div class="Hdomino Hdomino__remain"><div class="Vdomino__left"></div> <div class="Hdomino__right"></div></div>';
            remain.innerHTML = ''
            for(let i = 0; i< num; i++){
                remain.insertAdjacentHTML('beforeend', html)
            }
        },
        updateAICards(num){
            let html = '<div class="Vdomino"></div>';
            AICards.innerHTML = ''
            for(let i = 0; i< num; i++){
                AICards.insertAdjacentHTML('beforeend', html)
            }
        }
        
    }
})();

// Global Controller
const controller = (function(gameCtrl, UICtrl){
    const DOM = UICtrl.getDOMVars();

    const runEventsOnCards = () => {
        // Play Card
        const {cards, cardsLen} = UICtrl.getAllCards()
        
        for (let i = 0; i < cardsLen; i++) {
            cards[i].addEventListener('click', playCard)
            // cards[i].addEventListener('touchend', playCard)
        }
    }

    const newGame = () => {
        /**
         * Prepare all cards @newGame
         * Remove cards from players
         */
        gameCtrl.newGame()
        const {cards, turn, startedGame} = gameCtrl.getAllData()
        UICtrl.updateRemain(cards.length)
        
        let {me, enemy} = gameCtrl.getMeAndEnemy()

        UICtrl.updateAICards(enemy.cards.length)

        UICtrl.emptyContainer()

        me.cards.forEach((playerCard) => {
            UICtrl.createNewCard(playerCard)
        })

        runEventsOnCards()

    }

    const getCard = () => {
        /**
         * Use @pushCardToPlayer
         * To push new card to me
         */
        // const {turn} = gameCtrl.getAllData();
        // if(turn != 1) return;
        
        const card = gameCtrl.pushCardToPlayer()
        if(!card) return;
        UICtrl.createNewCard(card);
        runEventsOnCards()
        const {cards} = gameCtrl.getAllData()
        UICtrl.updateRemain(cards.length)

    }

    const winningFunc = (whereToPlay, newCard, winner) => {
        
        if(whereToPlay) UICtrl.cardToPlayGround(newCard, whereToPlay)
        const {players} = gameCtrl.getAllData()
        socket.emit('winner', {winner, players})
    }
    
    socket.on('winner', ({winner, players}) => {
        gameCtrl.setAllPlayers(players)

        UICtrl.clearScores()
        players.forEach((player) => {
            UICtrl.updateScores(player)
        })
        alert(winner)
    })


    const playCard = (e) => {

        let target = e.target;
        if(e.target.className == 'Hdomino__right' || e.target.className == 'Hdomino__left' || e.target.className == 'Vdomino__right' || e.target.className == 'Vdomino__left'){
            target = e.target.parentNode
        } else if(e.target.className == 'dot'){
            target = e.target.parentNode.parentNode
        }
        
        let {turn, ids} = gameCtrl.getAllData()
        let {me} = gameCtrl.getMeAndEnemy()        

        if(turn == me.socketId){

            let card = target.getAttribute('data-card').split(' ')
            card = [parseInt(card[0]), parseInt(card[1])]
            
            const {whereToPlay, newCard, winner} = gameCtrl.playCard(card)
            
            if(winner){return winningFunc(whereToPlay, newCard, winner)}
            
            if(!whereToPlay){
                return;
            }
            UICtrl.removeCard(target)
            UICtrl.cardToPlayGround(newCard, whereToPlay)
            
            let index = ids.findIndex((id) => {
                return turn == id
            })
            index = index == -1 ? 0 : index;
            const nextTurn = Math.pow((index - 1), 2)
            
            gameCtrl.changeTurn(nextTurn)

            const {players, cards} = gameCtrl.getAllData()
            
            socket.emit('updateCards', ({PlayerCards: players, remainCards:cards}))
            socket.emit('played', ({whereToPlay, newCard, newCards: me.cards, nextTurn, enemyId: ids[nextTurn]}))
            socket.emit('changeTurn', (nextTurn))
        }

    }

    socket.on('enemyPlayed', ({whereToPlay, newCard, newCards}) => {
        const {myId} = gameCtrl.getAllData()
        
        const {cards} = gameCtrl.getAllData()


        UICtrl.updateRemain(cards.length)

        UICtrl.updateAICards(newCards.length)
        if(newCard && whereToPlay) UICtrl.cardToPlayGround(newCard, whereToPlay)
        
    })

    socket.on('updateUICards', () => {
        
        let {me, enemy} = gameCtrl.getMeAndEnemy()
        const {cards} = gameCtrl.getAllData()

        UICtrl.updateRemain(cards.length)
        
        
        UICtrl.updateAICards(enemy.cards.length)

        UICtrl.emptyContainer()

        me.cards.forEach((playerCard) => {
            UICtrl.createNewCard(playerCard)
        })

        runEventsOnCards()
    })




    // Start New Game
    document.querySelector(DOM.newGame).addEventListener('click', newGame)
    // document.querySelector(DOM.newGame).addEventListener('touchend', newGame)

    // +1 Card
    document.querySelector(DOM.getCard).addEventListener('click', getCard)
    // document.querySelector(DOM.getCard).addEventListener('touchend', getCard)

})(gameController, UIController);
