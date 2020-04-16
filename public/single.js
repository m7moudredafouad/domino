// Game Controller
const gameController = (function () {
    // Code
    let data = {
        startedGame: false,
        allCards:[],
        player: [],
        AI: [],
        toPlayOn: [],
        whoseTurn: Math.ceil(Math.random() * 2) - 1, // 1 For Player 0 For AI
        AISum: 0,
        playerSum: 0,
        playerScore:0,
        AIScore:0,
    }
    const changeTurnFunc = () => {
        data.whoseTurn = Math.pow((data.whoseTurn - 1), 2)
    }

    const giveCards = (toPutIn, numCards) => {
        let taken;
        let cardsLen = data.allCards.length
        if(cardsLen == 1){
            if (!data.toPlayOn.includes(data.allCards[0][0]) && data.toPlayOn.includes(data.allCards[0][1])){
                changeTurnFunc()
            }
        }
        if(cardsLen < 1){
            return;
        }
        for(let i = 0;i <numCards; i++){
            cardsLen = data.allCards.length
            let random = Math.floor(Math.random() * cardsLen)
            taken = data.allCards.splice(random, 1)[0]
            toPutIn.push([taken[0], taken[1]])
        }
        return taken;
    }
    const removeCard = (removeFrom, card) => {
        let index =  removeFrom.findIndex((item)=> {
            return item[0] == card[0] && item[1] == card[1] || item[0] == card[1] && item[1] == card[0] 
        })
        if(index == -1){
            return;
        }
        removeFrom.splice(index, 1)
    }

    const playCardFunc = (card, notAITurn = true) => {
        let index,
            places = ['left', 'right']

        // if the game is starting
        if(data.toPlayOn.length == 0 && (data.allCards.length + data.AI.length + data.player.length) == 28) {
            data.toPlayOn = card
            if(notAITurn){
                removeCard(data.player, card)
            } else {
                removeCard(data.AI, card);
            }

            return {
                whereToPlay:places[0],
                newCard: card,
                winner: checkWinner()
            };

        }

        if(data.toPlayOn[0] == card[0] && data.toPlayOn[1] == card[1] && notAITurn){
            index = prompt('Left or right ?\n left (0) \n right (1)')

        } else if(data.toPlayOn[0] == card[1] && data.toPlayOn[1] == card[0] && notAITurn){
            index = prompt('Left or right ?\n left (0) \n right (1)')

        } else if(card.includes(data.toPlayOn[0])){
            index =  0
        } else if(card.includes(data.toPlayOn[1])){ 
            index = 1
        } else { 
            checkWinner()
            return false;
         }
        
        index = index / index || index / 1;
        const newCard = updateToPlayOn(index, card)
        if(notAITurn){
            removeCard(data.player, card)
        } else {
            removeCard(data.AI, card);
        }

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

    const searchForAICards = () => {
        let {availableLeft, availableRight, leftLen, rightLen} = searchforCards(data.AI)

        if(leftLen == 0 && rightLen == 0){
            giveCards(data.AI, 1);
            if(data.allCards.length == 0){
                return{
                    availableLeft,
                    availableRight,
                    leftLen,
                    rightLen
                };
            }
            return searchForAICards()
        }
        return {
            availableLeft,
            availableRight,
            leftLen,
            rightLen
        }
    }

    const AITurnFunc = () => {
        const {availableLeft, availableRight, leftLen, rightLen} = searchForAICards()
            
        let card = leftLen > rightLen ? availableLeft[Math.floor(Math.random()* leftLen)] : availableRight[Math.floor(Math.random()* rightLen)]
        
        if(!card){ 
            changeTurnFunc()
            return false;}

        return playCardFunc(card, false) 
    }

    const checkAfterremainCardsZero = (AIArr, playerArr) =>  {
        let message = '';
        if(data.allCards.length == 0){
            let AI = searchforCards(data.AI)
            let player = searchforCards(data.player)
            
            
            if(AI.leftLen == 0 && AI.rightLen == 0 && player.leftLen == 0 && player.rightLen == 0){
                data.AISum = AIArr[0].reduce((a, b) => a+b)
                data.playerSum = playerArr[0].reduce((a, b) => a + b)

                if(data.AISum > data.playerSum){
                    data.playerScore =+ data.AISum
                    message = `You Won with ${data.AISum}`
                    
                } else if(data.AISum == data.playerSum){
                    message = 'Draw'
                } else {
                    data.AIScore += data.playerSum
                    message = `Computer Won with ${data.playerSum}`
                }
                
            }else if(player.leftLen == 0 && player.rightLen == 0){
                // Player Has No Cards
                data.whoseTurn = 0 // AI
            } else if(AI.leftLen == 0 && AI.rightLen == 0) {
                // AI Has No Cards
                data.whoseTurn = 1 // Player
            }

        }

        return message != '' ? message: false;

    }

    const checkWinner = () => {
        let AIArr = [];
        let playerArr = [];
        data.startedGame = false;
        
        AIArr.push(data.AI.flat(Infinity))
        playerArr.push(data.player.flat(Infinity))
        
        if(data.AI.length == 0){
            data.playerSum = playerArr[0].reduce((a, b) => a + b)
            data.AIScore += data.playerSum
            return `Computer Won with ${data.playerSum}`
        }
        
        if(data.player.length == 0){
            data.AISum = AIArr[0].reduce((a, b) => a+b)
            data.playerScore += data.AISum
            return `You Won with ${data.AISum}`
        }

        const checked = checkAfterremainCardsZero(AIArr, playerArr);
        
        data.startedGame = true;
        return checked;
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
            data.player = [];  data.AI = []; data.allCards = []; data.toPlayOn = []
            data.startedGame = true;

            // Create Cards
            for (i = 0; i<7; i++){
                for(j=0; j<=i; j++){
                    data.allCards.push([i, j])
                }
            }

            // Begin Pushing Cards to players
            giveCards(data.player, 7)
            giveCards(data.AI, 7)

        },

        getAllData(){
            return {
                cards: data.allCards,
                player: data.player,
                AI: data.AI,
                toPlayOn: data.toPlayOn,
                turn: data.whoseTurn,
                PScore: data.playerScore,
                AScore: data.AIScore,
                startedGame: data.startedGame
            }
        },

        pushCardToPlayer(){
            const{leftLen, rightLen} = searchforCards(data.player)
            if(leftLen == 0 && rightLen == 0){
                return giveCards(data.player, 1)
            }
            return;
        },

        playCard(card, notAITurn) {
            return playCardFunc(card, notAITurn)
        },

        AITurn() {
            return AITurnFunc()
        },

        changeTurn() {
            return changeTurnFunc()
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
        AIScore: '#AIScore',
        playerScore: '#playerScore',
        container: '.cont',
        playGround: '.playGround',
        remain: '.remain',
        AICards: '.AICards'
    }
    let container = document.querySelector(DOMVars.container);
    let playGround = document.querySelector(DOMVars.playGround);
    let remain = document.querySelector(DOMVars.remain);
    let AICards = document.querySelector(DOMVars.AICards);

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

        updateScores(PScore, AScore) {
            let AIScore = document.querySelector(DOMVars.AIScore);
            let playerScore = document.querySelector(DOMVars.playerScore);

            AIScore.textContent = `Computer: ${AScore}`
            playerScore.textContent = `You: ${PScore}`
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
        const {cards, player, AI, turn, startedGame} = gameCtrl.getAllData()
        UICtrl.updateRemain(cards.length)
        UICtrl.updateAICards(AI.length)

        UICtrl.emptyContainer()

        player.forEach((playerCard) => {
            UICtrl.createNewCard(playerCard)
        })

        runEventsOnCards()

        if(turn == 0 && startedGame == true) {  // For the AI
            AIPlayCard();
        }
    }

    const getCard = () => {
        /**
         * Use @pushCardToPlayer
         * To push new card to me
         */
        const {turn} = gameCtrl.getAllData();
        if(turn != 1) return;
        
        const card = gameCtrl.pushCardToPlayer()
        if(!card) return;
        UICtrl.createNewCard(card);
        runEventsOnCards()
        const {cards} = gameCtrl.getAllData()
        UICtrl.updateRemain(cards.length)
    }

    const winningFunc = (whereToPlay, newCard, winner) => {
        const {PScore, AScore} = gameCtrl.getAllData()
        UICtrl.updateScores(PScore, AScore)
        
        if(whereToPlay) UICtrl.cardToPlayGround(newCard, whereToPlay)
        alert(winner)
        return newGame()
    }

    const AIPlayCard = () => {
        const {turn, startedGame} = gameCtrl.getAllData()
        if(startedGame == false) {return;}

        if(turn == 0){

            const {whereToPlay, newCard, winner} = gameCtrl.AITurn()
            const {cards, AI} = gameCtrl.getAllData()
            UICtrl.updateRemain(cards.length)
            UICtrl.updateAICards(AI.length)

            if(winner){return winningFunc(whereToPlay, newCard, winner)}
            
            if(!whereToPlay) return;
            UICtrl.cardToPlayGround(newCard, whereToPlay)
            
            gameCtrl.changeTurn()

        }

    }

    const playCard = (e) => {

        let target = e.target;
        if(e.target.className == 'Hdomino__right' || e.target.className == 'Hdomino__left' || e.target.className == 'Vdomino__right' || e.target.className == 'Vdomino__left'){
            target = e.target.parentNode
        } else if(e.target.className == 'dot'){
            target = e.target.parentNode.parentNode
        }

        const {turn, startedGame} = gameCtrl.getAllData()
        if(startedGame == false) {return;}

        if(turn == 1) {
            let card = target.getAttribute('data-card').split(' ')
            card = [parseInt(card[0]), parseInt(card[1])]
            
            const {whereToPlay, newCard, winner} = gameCtrl.playCard(card)
            
            if(winner){return winningFunc(whereToPlay, newCard, winner)}
            
            if(!whereToPlay){
                return;
            }
            UICtrl.removeCard(target)
            UICtrl.cardToPlayGround(newCard, whereToPlay)
            
            gameCtrl.changeTurn()
            
        }

            setTimeout(() => {
                AIPlayCard();
            }, 500)

    }

    // Start New Game
    document.querySelector(DOM.newGame).addEventListener('click', newGame)
    // document.querySelector(DOM.newGame).addEventListener('touchend', newGame)

    // +1 Card
    document.querySelector(DOM.getCard).addEventListener('click', getCard)
    // document.querySelector(DOM.getCard).addEventListener('touchend', getCard)


})(gameController, UIController);
