import { db } from './firebase.js';
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- 1. IDENTITY LOGIC ---
const urlParams = new URLSearchParams(window.location.search);
const playerNum = urlParams.get('player'); 
const myId = `player${playerNum}`;
const opponentId = playerNum === "1" ? "player2" : "player1";

if (!playerNum) {
    alert("Missing player ID! Use ?player=1 or ?player=2 in the URL.");
}

const colors = ['red', 'blue', 'green', 'yellow'];
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
let playerHand = [];
let discardCard = null;
let currentTurn = "1";

function createCard() {
    return {
        color: colors[Math.floor(Math.random() * colors.length)],
        number: numbers[Math.floor(Math.random() * numbers.length)]
    };
}

// --- 2. FIREBASE SYNC ---
onValue(ref(db, 'game'), (snapshot) => {
    const data = snapshot.val();
    
    // Pag nag-reset ang game o walang data, mag-restart ng hand
    if (!data || !data.discardPile) {
        initGame(); 
        return;
    }

    discardCard = data.discardPile;
    currentTurn = data.currentTurn;
    const oppCount = data[opponentId] ? data[opponentId].count : 0;
    
    render(oppCount);
});

function initGame() {
    playerHand = [];
    for(let i=0; i<7; i++) {
        playerHand.push(createCard());
    }
    updateMyCount();
}

function updateMyCount() {
    set(ref(db, `game/${myId}/count`), playerHand.length);
}

// --- 3. GAME ACTIONS ---
window.drawCard = function() {
    if (currentTurn !== playerNum) {
        alert("It's not your turn!");
        return;
    }

    // Prevents double-clicking the deck
    document.getElementById('deck').style.pointerEvents = 'none';

    playerHand.push(createCard());
    updateMyCount();
    
    // Pass turn to opponent
    const nextTurn = playerNum === "1" ? "2" : "1";
    set(ref(db, 'game/currentTurn'), nextTurn);

    // Re-enable deck after 500ms
    setTimeout(() => {
        document.getElementById('deck').style.pointerEvents = 'auto';
    }, 500);
};

window.playCard = function(index) {
    if (currentTurn !== playerNum) {
        alert("It's not your turn!");
        return;
    }

    const card = playerHand[index];
    // Check if card matches discard pile
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

// --- 4. UI RENDER ---
function render(opponentCardCount) {
    const handDiv = document.getElementById('player-hand');
    const oppHandDiv = document.getElementById('opponent-hand');
    const discardDiv = document.getElementById('discard-pile');
    const statusDiv = document.getElementById('status');

    // Display Turn Status
    if (currentTurn === playerNum) {
        statusDiv.innerText = "Your Turn! 🟢";
        statusDiv.style.color = "#2ecc71";
    } else {
        statusDiv.innerText = "Partner's Turn... 🔴";
        statusDiv.style.color = "#e74c3c";
    }

    // Render My Hand
    handDiv.innerHTML = '';
    playerHand.forEach((card, i) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color}`;
        cardEl.innerText = card.number;
        cardEl.onclick = () => window.playCard(i); 
        handDiv.appendChild(cardEl);
    });

    // Render Opponent's Hand Count (Hidden)
    oppHandDiv.innerHTML = '';
    for(let i=0; i < opponentCardCount; i++) {
        const backEl = document.createElement('div');
        backEl.className = `card card-back`;
        backEl.innerText = 'UNO';
        oppHandDiv.appendChild(backEl);
    }

    // Update Discard Pile
    if (discardCard) {
        discardDiv.innerHTML = `<div class="card ${discardCard.color}">${discardCard.number}</div>`;
    }
}

// --- 5. RESET LOGIC ---
window.resetGame = function() {
    if (confirm("Reset game for both players?")) {
        set(ref(db, 'game'), {
            discardPile: createCard(),
            currentTurn: "1"
        });
    }
};

// Start the local instance
initGame();