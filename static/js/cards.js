document.addEventListener('DOMContentLoaded', () => {
    const questionInput = document.getElementById('question-input');
    const submitBtn = document.getElementById('submit-btn');
    const cardContainer = document.getElementById('card-container');
    const readingResult = document.getElementById('reading-result');
    const resultText = document.getElementById('result-text');
    
    let selectedCards = [];
    let isShuffling = false;

    // Initialize the card deck
    function initializeDeck() {
        cardContainer.innerHTML = '';
        selectedCards = [];
        
        // Create 78 tarot cards (placeholder for now)
        for (let i = 0; i < 78; i++) {
            const card = document.createElement('div');
            card.className = 'tarot-card';
            card.dataset.cardId = i;
            
            const front = document.createElement('div');
            front.className = 'card-front';
            front.textContent = '?';
            
            const back = document.createElement('div');
            back.className = 'card-back';
            
            card.appendChild(front);
            card.appendChild(back);
            cardContainer.appendChild(card);
            
            // Add click event to each card
            card.addEventListener('click', () => selectCard(card));
        }
    }

    // Handle card selection
    function selectCard(card) {
        if (isShuffling) return;
        
        const cardId = card.dataset.cardId;
        if (selectedCards.includes(cardId)) {
            // Deselect card
            card.classList.remove('flipped');
            selectedCards = selectedCards.filter(id => id !== cardId);
        } else {
            // Select card
            card.classList.add('flipped');
            selectedCards.push(cardId);
        }
    }

    // Shuffle animation
    function shuffleCards() {
        if (isShuffling) return;
        isShuffling = true;
        
        const cards = document.querySelectorAll('.tarot-card');
        cards.forEach(card => {
            card.classList.add('shuffling');
        });
        
        setTimeout(() => {
            cards.forEach(card => {
                card.classList.remove('shuffling');
            });
            isShuffling = false;
        }, 500);
    }

    // Submit reading
    submitBtn.addEventListener('click', async () => {
        if (selectedCards.length === 0) {
            alert('Please select at least one card');
            return;
        }

        const question = questionInput.value.trim();
        if (!question) {
            alert('Please enter your question');
            return;
        }

        try {
            const response = await fetch('/api/reading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    cards: selectedCards
                })
            });

            const data = await response.json();
            displayReading(data);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing your reading');
        }
    });

    // Display reading results
    function displayReading(data) {
        resultText.textContent = data.interpretation;
        readingResult.classList.add('show');
    }

    // Initialize the deck when the page loads
    initializeDeck();
}); 