document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt');
    const imageUpload = document.getElementById('imageUpload');
    const uploadButton = document.getElementById('uploadButton');
    const fileName = document.getElementById('fileName');
    const submitButton = document.getElementById('submitButton');
    const responseDiv = document.getElementById('response');
    const chatHistoryDiv = document.getElementById('chatHistory');
    const newSessionButton = document.getElementById('newSessionButton');

    let selectedImage = null;

    uploadButton.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImage = e.target.result.split(',')[1]; // Get base64 data
            };
            reader.readAsDataURL(file);
        }
    });

    submitButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }

        submitButton.disabled = true;
        responseDiv.innerHTML = 'Processing...';

        try {
            const response = await fetch('/api/nature-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, image: selectedImage }),
            });

            const data = await response.json();
            responseDiv.innerHTML = `<p>${data.response}</p>`;
            loadChatHistory();
        } catch (error) {
            console.error('Error:', error);
            responseDiv.innerHTML = 'An error occurred while processing your request.';
        } finally {
            submitButton.disabled = false;
        }
    });

    newSessionButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/new-session');
            const data = await response.json();
            responseDiv.innerHTML = 'New session started. Previous chat history retained.';
            loadChatHistory();
        } catch (error) {
            console.error('Error starting new session:', error);
        }
    });

    async function loadChatHistory() {
        try {
            const response = await fetch('/api/chat-history');
            const data = await response.json();
            chatHistoryDiv.innerHTML = '';
            data.chatHistory.forEach((chat, index) => {
                const chatItem = document.createElement('div');
                chatItem.classList.add('chat-item', 'mb-4');
                chatItem.innerHTML = `
                    <div class="chat-prompt bg-gray-700 p-3 rounded-t-lg">${chat.prompt}</div>
                    <div class="chat-response bg-gray-800 p-3 rounded-b-lg">${chat.response}</div>
                `;
                chatHistoryDiv.appendChild(chatItem);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    loadChatHistory();
});
