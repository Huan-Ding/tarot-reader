// Store the previous reading context
let previousReadingContext = null;

// Handle follow-up question button click
document.getElementById('ask-followup').addEventListener('click', function() {
    const followupSection = document.getElementById('followup-section');
    followupSection.style.display = 'block';
    followupSection.scrollIntoView({ behavior: 'smooth' });
});

// Handle follow-up form submission
document.getElementById('followup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const followupQuestion = document.getElementById('followup-question').value.trim();
    if (!followupQuestion) return;

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Getting Reading...';
    submitButton.disabled = true;

    try {
        // Include previous reading context in the API call
        const response = await fetch('/get_reading', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: followupQuestion,
                previous_context: previousReadingContext
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Update the reading result with the new response
        document.getElementById('reading-result').innerHTML = data.response;
        
        // Store the new reading context for future follow-ups
        previousReadingContext = data.context;

        // Hide the follow-up section
        document.getElementById('followup-section').style.display = 'none';
        
        // Clear the follow-up question input
        document.getElementById('followup-question').value = '';

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while getting your reading. Please try again.');
    } finally {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});

// Update the original form submission to store context
document.getElementById('question-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const question = document.getElementById('question').value.trim();
    if (!question) return;

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Getting Reading...';
    submitButton.disabled = true;

    try {
        const response = await fetch('/get_reading', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                previous_context: null
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Update the reading result
        document.getElementById('reading-result').innerHTML = data.response;
        
        // Store the reading context for future follow-ups
        previousReadingContext = data.context;

        // Hide the question form
        this.style.display = 'none';
        
        // Show the reading result
        document.getElementById('reading-result').style.display = 'block';
        
        // Show the button group
        document.querySelector('.button-group').style.display = 'flex';

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while getting your reading. Please try again.');
    } finally {
        // Restore button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});

function showReadingResult(reading) {
    const resultSection = document.getElementById('reading-result');
    const cardSection = document.getElementById('card-section');
    const followupSection = document.getElementById('followup-section');
    const buttonGroup = document.querySelector('.button-group');
    
    // Hide card section and show result
    cardSection.style.display = 'none';
    resultSection.style.display = 'block';
    followupSection.style.display = 'block';
    buttonGroup.style.display = 'flex';
    
    // Update reading text
    document.getElementById('reading-text').innerHTML = reading.replace(/\n/g, '<br>');
}

function resetReading() {
    const resultSection = document.getElementById('reading-result');
    const cardSection = document.getElementById('card-section');
    const followupSection = document.getElementById('followup-section');
    const buttonGroup = document.querySelector('.button-group');
    const questionForm = document.getElementById('question-form');
    
    // Hide result and followup sections
    resultSection.style.display = 'none';
    followupSection.style.display = 'none';
    buttonGroup.style.display = 'none';
    
    // Reset and show question form
    questionForm.reset();
    questionForm.style.display = 'block';
    
    // Reset card section
    cardSection.style.display = 'block';
    resetCardSelection();
}

function handleFollowupQuestion(event) {
    event.preventDefault();
    const followupQuestion = document.getElementById('followup-question').value.trim();
    
    if (!followupQuestion) {
        alert('Please enter a follow-up question');
        return;
    }
    
    // Hide followup section and button group while processing
    document.getElementById('followup-section').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    
    // Show loading state
    document.getElementById('reading-text').innerHTML = 'Consulting the cards...';
    
    // Send followup question to server
    fetch('/ask_followup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: followupQuestion
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        showReadingResult(data.reading);
    })
    .catch(error => {
        alert('Error: ' + error.message);
        // Show followup section and button group again
        document.getElementById('followup-section').style.display = 'block';
        document.querySelector('.button-group').style.display = 'flex';
    });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    const followupForm = document.getElementById('followup-form');
    const newReadingButton = document.querySelector('.new-reading-button');
    
    followupForm.addEventListener('submit', handleFollowupQuestion);
    newReadingButton.addEventListener('click', resetReading);
}); 