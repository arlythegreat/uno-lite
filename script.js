import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB58mgBHg0SvgSkvUHV44YHi7ZZ9gOHmbo",
    authDomain: "uno-221ea.firebaseapp.com",
    databaseURL: "https://uno-221ea-default-rtdb.firebaseio.com",
    projectId: "uno-221ea",
    storageBucket: "uno-221ea.firebasestorage.app",
    messagingSenderId: "63182321440",
    appId: "1:63182321440:web:90ce1d94df0514b7038945",
    measurementId: "G-6QNZLERLZE"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const urlParams = new URLSearchParams(window.location.search);
const playerNum = urlParams.get('player'); 
const myId = `player${playerNum}`;
const opponentId = playerNum === "1" ? "player2" : "player1";

// Toggle UI
if (playerNum) {
    document.getElementById('lobby-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
}

const numberToWord = {
    0: "zero", 1: "one", 2: "two", 3: "three", 4: "four",
    5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine"
};

const colors = ['red', 'blue', 'green', 'yellow'];
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
let playerHand = [];
let discardCard = null;
let currentTurn = "1";
let gameStarted = false; // Prevents re-initializing hand mid-game

function createCard() {
    return {
        color: colors[Math.floor(Math.random() * colors.length)],
        number: numbers[Math.floor(Math.random() * numbers.length)]
    };
}

// Watch Firebase for changes
onValue(ref(db, 'game'), (snapshot) => {
    const data = snapshot.val();
    
    if (!data || !data.discardPile) {
        if (playerNum === "1" && !gameStarted) initGame();
        return;
    }

    // Update global game state
    discardCard = data.discardPile;
    currentTurn = data.currentTurn;
    const oppCount = data[opponentId] ? data[opponentId].count : 0;
    
    // First time joining? Give the player their starting hand
    if (!gameStarted && playerNum) {
        fillStartingHand();
        gameStarted = true;
    }

    if (playerNum) render(oppCount);
});

function initGame() {
    // Shared game state initialization (Run by Player 1)
    set(ref(db, 'game/discardPile'), createCard());
    set(ref(db, 'game/currentTurn'), "1");
}

function fillStartingHand() {
    playerHand = [];
    for(let i=0; i<7; i++) {
        playerHand.push(createCard());
    }
    updateMyCount();
}

function updateMyCount() {
    if (playerNum) {
        set(ref(db, `game/${myId}/count`), playerHand.length);
    }
}

window.drawCard = function() {
    if (currentTurn !== playerNum) {
        alert("It's not your turn!");
        return;
    }
    playerHand.push(createCard());
    updateMyCount();
    
    const nextTurn = playerNum === "1" ? "2" : "1";
    set(ref(db, 'game/currentTurn'), nextTurn);
};

window.playCard = function(index) {
    if (currentTurn !== playerNum) {
        alert("It's not your turn!");
        return;
    }
    const card = playerHand[index];
    
    if (card.color === discardCard.color || card.number === discardCard.number) {
        const nextTurn = playerNum === "1" ? "2" : "1";
        set(ref(db, 'game/discardPile'), card);
        set(ref(db, 'game/currentTurn'), nextTurn);
        playerHand.splice(index, 1);
        updateMyCount();
        if(playerHand.length === 0) alert("UNO! You win! 🏆");
    } else {
        alert("Cannot play that card!");
    }
}

function render(opponentCardCount) {
    const handDiv = document.getElementById('player-hand');
    const oppHandDiv = document.getElementById('opponent-hand');
    const discardDiv = document.getElementById('discard-pile');
    const statusDiv = document.getElementById('status');

    statusDiv.innerText = (currentTurn === playerNum) ? "Your Turn! 🟢" : "Partner's Turn... 🔴";
    statusDiv.style.color = (currentTurn === playerNum) ? "#2ecc71" : "#e74c3c";

    handDiv.innerHTML = '';
    playerHand.forEach((card, i) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        const word = numberToWord[card.number];
        cardEl.innerHTML = `<img src="images/${card.color}/${word}.jpg" width="100%" style="border-radius:8px">`;
        cardEl.onclick = () => window.playCard(i); 
        handDiv.appendChild(cardEl);
    });

    oppHandDiv.innerHTML = '';
    for(let i=0; i < opponentCardCount; i++) {
        const backEl = document.createElement('div');
        backEl.className = 'card';
        backEl.innerHTML = `<img src="images/Uno card.jpg" width="100%" style="border-radius:8px">`;
        oppHandDiv.appendChild(backEl);
    }

    if (discardCard) {
        const discardWord = numberToWord[discardCard.number];
        discardDiv.innerHTML = `<div class="card"><img src="images/${discardCard.color}/${discardWord}.jpg" width="100%" style="border-radius:8px"></div>`;
    }
}

window.resetGame = function() {
    if (confirm("Reset game for both players?")) {
        gameStarted = false;
        set(ref(db, 'game'), null); // Wipes Firebase data to trigger a fresh start
    }
};
