// State management
const state = {
    question: '',
    selectedCards: [],
    recommendedCards: 3,
    currentCardIndex: 0,
    totalCards: 78,
    isRevealed: false
};

// Tarot card data
const tarotCards = {
    majorArcana: [
        "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
        "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
        "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
        "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
        "Judgement", "The World"
    ],
    minorArcana: {
        wands: ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"],
        cups: ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"],
        swords: ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"],
        pentacles: ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"]
    }
};

// Get card name from index
function getCardName(index) {
    if (index < 22) {
        return tarotCards.majorArcana[index];
    } else {
        const minorIndex = index - 22;
        const suit = Math.floor(minorIndex / 14);
        const rank = minorIndex % 14;
        const suits = ["Wands", "Cups", "Swords", "Pentacles"];
        return `${tarotCards.minorArcana[suits[suit].toLowerCase()][rank]} of ${suits[suit]}`;
    }
}

// Get card image path from card name
/*
function getCardImagePath(cardName) {
    // Handle Major Arcana
    if (tarotCards.majorArcana.includes(cardName)) {
        return `../images/cards/Major/${cardName.replace(/ /g, '_')}.jpg`;
    }
    
    // Handle Minor Arcana
    const [rank, , suit] = cardName.split(' ');
    return `../images/cards/${suit}/${cardName.replace(/ /g, '_')}.jpg`;
}
*/

// DOM Elements
let questionForm;
let cardSection;
let cardContainer;
let cardSlots;
let prevButton;
let nextButton;
let readingResult;
let interpretation;

// Initialize the application
function init() {
    console.log('=== Initializing application ===');
    questionForm = document.getElementById('question-form');
    cardSection = document.getElementById('card-section');
    cardContainer = document.getElementById('card-container');
    cardSlots = document.querySelector('.card-slots');
    prevButton = document.getElementById('prev-card');
    nextButton = document.getElementById('next-card');
    readingResult = document.getElementById('reading-result');
    interpretation = document.getElementById('interpretation');

    console.log('DOM elements initialized:', {
        questionForm: !!questionForm,
        cardSection: !!cardSection,
        cardContainer: !!cardContainer,
        cardSlots: !!cardSlots,
        prevButton: !!prevButton,
        nextButton: !!nextButton,
        readingResult: !!readingResult,
        interpretation: !!interpretation
    });

    // Event Listeners
    questionForm.addEventListener('submit', handleQuestionSubmit);
    prevButton.addEventListener('click', () => navigateCards('prev'));
    nextButton.addEventListener('click', () => navigateCards('next'));
    
    // Add event listener for Ask Another Question button
    const askAnotherButton = document.getElementById('ask-another');
    if (askAnotherButton) {
        askAnotherButton.addEventListener('click', resetApplication);
    }
    
    console.log('Event listeners attached');
    console.log('=== Initialization complete ===');
}

// Reset application state
function resetApplication() {
    console.log('=== Starting resetApplication ===');
    
    // Reset state
    state.question = '';
    state.selectedCards = [];
    state.currentCardIndex = 0;
    state.isRevealed = false;
    
    // Hide card section and reading result
    cardSection.style.display = 'none';
    readingResult.style.display = 'none';
    
    // Show question form
    questionForm.style.display = 'block';
    
    // Clear the question input
    const questionInput = document.getElementById('question');
    questionInput.value = '';
    
    console.log('Application state reset');
    console.log('=== Ending resetApplication ===');
}

// Handle question submission
async function handleQuestionSubmit(event) {
    event.preventDefault();
    console.log('=== Starting handleQuestionSubmit ===');
    
    const questionInput = document.getElementById('question');
    const question = questionInput.value.trim();
    console.log('Question:', question);
    
    if (!question) {
        showMessage('Please enter your question');
        return;
    }
    
    state.question = question;
    console.log('Updated state.question:', state.question);
    
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message loading';
    loadingMessage.textContent = 'Cards are being shuffled...';
    document.body.appendChild(loadingMessage);
    
    try {
        console.log('Sending request to /api/recommend...');
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        
        console.log('Response received:', response);
        const data = await response.json();
        console.log('API Response data:', data);
        console.log('Recommended cards from API:', data.recommended_cards);
        
        // Remove loading message
        loadingMessage.remove();
        
        if (data.error) {
            console.error('API Error:', data.error);
            showMessage('Failed to get card recommendation. Using default of 3 cards.');
            state.recommendedCards = 3;
            console.log('Set recommendedCards to default (3) due to error');
            showCardSelection();
            return;
        }
        
        if (!data.recommended_cards || data.recommended_cards < 1 || data.recommended_cards > 5) {
            console.warn('Invalid card count received:', data.recommended_cards);
            showMessage('Invalid recommendation received. Using default of 3 cards.');
            state.recommendedCards = 3;
            console.log('Set recommendedCards to default (3) due to invalid count');
            showCardSelection();
            return;
        }
        
        // Update state with the recommended number of cards
        state.recommendedCards = data.recommended_cards;
        console.log('Updated state.recommendedCards:', state.recommendedCards);
        console.log('Current state:', JSON.stringify(state, null, 2));
        
        // Hide the question form and show card section
        questionForm.style.display = 'none';
        cardSection.style.display = 'block';
        console.log('Question form hidden, card section shown');
        
        // Show card selection
        console.log('Calling showCardSelection with recommendedCards:', state.recommendedCards);
        showCardSelection();
        
        // Show the explanation if available
        if (data.explanation) {
            console.log('Showing explanation:', data.explanation);
            showMessage(data.explanation);
        }
        
    } catch (error) {
        console.error('Error in handleQuestionSubmit:', error);
        // Remove loading message
        loadingMessage.remove();
        showMessage('Failed to get card recommendation. Using default of 3 cards.');
        state.recommendedCards = 3;
        console.log('Set recommendedCards to default (3) due to exception');
        showCardSelection();
    } finally {
        console.log('=== Ending handleQuestionSubmit ===');
    }
}

// Show card selection interface
function showCardSelection() {
    console.log('=== Starting showCardSelection ===');
    console.log('Current state.recommendedCards:', state.recommendedCards);
    
    // Clear previous cards
    cardContainer.innerHTML = '';
    cardSlots.innerHTML = '';
    console.log('Cleared card containers');
    
    // Create card slots based on recommended number
    for (let i = 0; i < state.recommendedCards; i++) {
        console.log(`Creating card slot ${i + 1} of ${state.recommendedCards}`);
        const cardSlot = document.createElement('div');
        cardSlot.className = 'card-slot';
        cardSlots.appendChild(cardSlot);
    }
    
    // Create cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    
    // Show instructions
    const message = document.createElement('div');
    message.className = 'message';
    message.id = 'selection-message';
    message.textContent = `Please select ${state.recommendedCards} cards for your reading`;
    document.body.appendChild(message);
    
    // Create cards
    createCards(cardsContainer);
    
    // Add cards container to the page
    cardContainer.appendChild(cardsContainer);
    
    // Update card positions
    updateCardPositions();
    
    console.log('Card selection setup complete');
    console.log('Total card slots created:', document.querySelectorAll('.card-slot').length);
    console.log('=== Ending showCardSelection ===');
}

// Create tarot cards
function createCards(container) {
    console.log('=== Starting createCards ===');
    console.log('Creating cards for container:', container);
    
    // Create array of card indices and shuffle them
    const cardIndices = Array.from({ length: state.totalCards }, (_, i) => i);
    shuffleArray(cardIndices);
    console.log('Shuffled card indices:', cardIndices);
    
    // Create all 78 tarot cards in shuffled order
    cardIndices.forEach((index, i) => {
        console.log(`Creating card ${i + 1} of ${state.totalCards}`);
        
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        const cardName = getCardName(index);
        // Comment out image-related code
        /*
        cardFront.style.backgroundImage = `url('${getCardImagePath(cardName)}')`;
        */
        cardFront.textContent = cardName;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);
        
        // Add click handler for card selection
        card.addEventListener('click', () => handleCardSelection(card));
        
        container.appendChild(card);
    });
    
    console.log('Cards created and added to container');
    console.log('=== Ending createCards ===');
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    console.log('=== Starting shuffleArray ===');
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    console.log('Array shuffled');
    console.log('=== Ending shuffleArray ===');
}

// Update card positions in coverflow
function updateCardPositions() {
    console.log('=== Starting updateCardPositions ===');
    
    const cards = document.querySelectorAll('.card:not(.selected)');
    console.log('Total cards to position:', cards.length);
    
    // Hide all cards first
    cards.forEach(card => {
        card.style.display = 'none';
    });
    
    // Show and position visible cards
    const visibleCards = Array.from(cards).slice(state.currentCardIndex, state.currentCardIndex + 5);
    console.log('Visible cards:', visibleCards.length);
    
    visibleCards.forEach((card, index) => {
        const angle = (index - 2) * 15; // -30, -15, 0, 15, 30 degrees
        const x = Math.sin(angle * Math.PI / 180) * 200;
        const z = Math.cos(angle * Math.PI / 180) * 200;
        const scale = 1 - Math.abs(index - 2) * 0.1;
        const opacity = 1 - Math.abs(index - 2) * 0.2;
        
        card.style.display = 'block';
        card.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.zIndex = 5 - Math.abs(index - 2);
    });
    
    // Update navigation buttons visibility
    prevButton.style.display = state.currentCardIndex > 0 ? 'block' : 'none';
    nextButton.style.display = state.currentCardIndex < cards.length - 5 ? 'block' : 'none';
    
    console.log('=== Ending updateCardPositions ===');
}

// Navigate through cards
function navigateCards(direction) {
    console.log('=== Starting navigateCards ===');
    console.log('Direction:', direction);
    console.log('Current card index:', state.currentCardIndex);
    
    if (state.isRevealed) {
        console.log('Cards already revealed, navigation disabled');
        return;
    }
    
    if (direction === 'prev') {
        state.currentCardIndex = Math.max(0, state.currentCardIndex - 1);
    } else {
        state.currentCardIndex = Math.min(state.totalCards - 5, state.currentCardIndex + 1);
    }
    
    console.log('New card index:', state.currentCardIndex);
    updateCardPositions();
    console.log('=== Ending navigateCards ===');
}

// Handle card selection
function handleCardSelection(card) {
    console.log('=== Starting handleCardSelection ===');
    console.log('Selected card index:', card.dataset.index);
    console.log('Current selected cards:', state.selectedCards);
    console.log('Recommended cards:', state.recommendedCards);
    
    if (state.isRevealed) {
        console.log('Cards already revealed, selection disabled');
        return;
    }
    
    if (state.selectedCards.length >= state.recommendedCards) {
        console.log('Maximum number of cards already selected');
        showMessage('You have already selected the maximum number of cards');
        return;
    }
    
    if (state.selectedCards.includes(parseInt(card.dataset.index))) {
        console.log('Card already selected');
        return;
    }
    
    // Add card to selected cards
    state.selectedCards.push(parseInt(card.dataset.index));
    console.log('Updated selected cards:', state.selectedCards);
    
    // Find an empty slot
    const emptySlot = document.querySelector('.card-slot:empty');
    if (emptySlot) {
        // Create a clone of the selected card
        const selectedCard = card.cloneNode(true);
        selectedCard.classList.add('selected');
        selectedCard.style.position = 'relative';
        selectedCard.style.transform = 'none';
        selectedCard.style.width = '100%';
        selectedCard.style.height = '100%';
        selectedCard.style.margin = '0';
        selectedCard.style.padding = '0';
        
        // Add the card to the slot
        emptySlot.appendChild(selectedCard);
        console.log('Card added to slot');
        
        // Remove the original card from the coverflow
        card.remove();
        console.log('Original card removed from coverflow');
        
        // Update card positions
        updateCardPositions();
    }
    
    // If all recommended cards are selected, show the confirm button
    if (state.selectedCards.length === state.recommendedCards) {
        console.log('All recommended cards selected, showing confirm button');
        showConfirmButton();
    }
    
    // Hide the selection message
    const selectionMessage = document.getElementById('selection-message');
    if (selectionMessage) {
        selectionMessage.remove();
    }
    
    console.log('=== Ending handleCardSelection ===');
}

// Show confirm button
function showConfirmButton() {
    console.log('=== Starting showConfirmButton ===');
    
    // Check if confirm button already exists
    const existingButton = document.querySelector('.confirm-button');
    if (existingButton) {
        console.log('Confirm button already exists');
        return;
    }
    
    // Create confirm button
    const confirmButton = document.createElement('button');
    confirmButton.className = 'confirm-button';
    confirmButton.textContent = 'Confirm Selection';
    
    // Add click event listener
    confirmButton.addEventListener('click', handleConfirmSelection);
    
    // Add button to the page
    document.body.appendChild(confirmButton);
    console.log('Confirm button added to page');
    
    console.log('=== Ending showConfirmButton ===');
}

// Handle confirm selection
async function handleConfirmSelection() {
    console.log('=== Starting handleConfirmSelection ===');
    
    // Remove the confirm button
    const confirmButton = document.querySelector('.confirm-button');
    if (confirmButton) {
        confirmButton.remove();
    }
    
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message loading';
    loadingMessage.textContent = 'Your cards are being read...';
    document.body.appendChild(loadingMessage);
    
    // Reveal cards immediately
    revealCards();
    
    try {
        console.log('Sending request to /api/reading...');
        const response = await fetch('/api/reading', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: state.question,
                cards: state.selectedCards
            })
        });
        
        console.log('Response received:', response);
        const data = await response.json();
        console.log('API Response data:', data);
        
        // Remove loading message
        loadingMessage.remove();
        
        if (data.error) {
            console.error('API Error:', data.error);
            showError(data.error);
            return;
        }

        // Show reading result
        showReadingResult(data.interpretation);
    } catch (error) {
        console.error('Error in handleConfirmSelection:', error);
        // Remove loading message
        loadingMessage.remove();
        showError('Failed to get reading interpretation. Please try again.');
    } finally {
        console.log('=== Ending handleConfirmSelection ===');
    }
}

// Reveal selected cards
function revealCards() {
    console.log('=== Starting revealCards ===');
    state.isRevealed = true;
    const selectedCards = document.querySelectorAll('.card-slot .card');
    selectedCards.forEach(card => {
        card.classList.add('revealed');
    });
    console.log('All selected cards revealed');
    console.log('=== Ending revealCards ===');
}

// Show reading result
function showReadingResult(interpretationText) {
    const confirmButton = document.querySelector('.confirm-button');
    if (confirmButton) {
        confirmButton.remove();
    }

    interpretation.textContent = interpretationText;
    readingResult.style.display = 'block';
}

// Show message
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Show error
function showError(error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error';
    errorElement.textContent = error;
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 

