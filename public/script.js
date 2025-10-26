document.addEventListener('DOMContentLoaded', () => {
    // Element selections
    const cdnBtn = document.getElementById('cdnBtn');
    const shortUrlBtn = document.getElementById('shortUrlBtn');
    const cdnSection = document.getElementById('cdn-section');
    const shortUrlSection = document.getElementById('shorturl-section');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const cdnResult = document.getElementById('cdn-result');
    const shortenBtn = document.getElementById('shorten-btn');
    const longUrlInput = document.getElementById('long-url');
    const customCodeInput = document.getElementById('custom-code');
    const shortUrlResult = document.getElementById('shorturl-result');
    const historyContainer = document.getElementById('history-container');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const tutorialModal = document.getElementById('tutorial-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const MAX_HISTORY_ITEMS = 5;

    // Tab switching logic
    function switchTab(tab) {
        const sections = [cdnSection, shortUrlSection];
        const buttons = [cdnBtn, shortUrlBtn];
        const activeSection = tab === 'cdn' ? cdnSection : shortUrlSection;
        const activeButton = tab === 'cdn' ? cdnBtn : shortUrlBtn;

        buttons.forEach(button => {
            button.classList.remove('border-blue-500', 'text-blue-600');
            button.classList.add('border-transparent');
        });

        activeButton.classList.add('border-blue-500', 'text-blue-600');
        activeButton.classList.remove('border-transparent');

        sections.forEach(section => {
            if (section !== activeSection) {
                section.classList.add('hidden');
            }
        });

        activeSection.classList.remove('hidden');
        activeSection.classList.add('animate-fade-in');
    }

    // Main event listeners
    function setupEventListeners() {
        cdnBtn.addEventListener('click', () => switchTab('cdn'));
        shortUrlBtn.addEventListener('click', () => switchTab('shorturl'));
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-blue-500'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-blue-500'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500');
            if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) handleFileUpload(fileInput.files[0]);
        });
        shortenBtn.addEventListener('click', handleShortenUrl);
    }

    // UI update functions
    function showLoading(element) {
        element.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-500"></i>
            </div>
        `;
    }

    function showResult(element, text, isUrl = true) {
        const icon = isUrl ? '<i class="fas fa-copy"></i>' : '<i class="fas fa-exclamation-circle text-red-500"></i>';
        const textColor = isUrl ? 'text-blue-600' : 'text-red-600';
        
        element.innerHTML = `
            <div class="result-area-content flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <a href="${isUrl ? text : '#'}" target="_blank" rel="noopener noreferrer" class="truncate ${textColor} font-mono">${text}</a>
                <button class="copy-btn p-2 rounded-md hover:bg-gray-200">${icon}</button>
            </div>
        `;

        const copyBtn = element.querySelector('.copy-btn');
        if (isUrl && copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(text);
                copyBtn.innerHTML = '<i class="fas fa-check text-green-500"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = icon;
                }, 2000);
            });
        }
    }

    // API call handlers
    async function handleFileUpload(file) {
        showLoading(cdnResult);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                showResult(cdnResult, data.url);
                saveToHistory(data.url);
            } else {
                showResult(cdnResult, `Error: ${data.error}`, false);
            }
        } catch (error) {
            showResult(cdnResult, 'Upload failed.', false);
        }
    }

    async function handleShortenUrl() {
        const longUrl = longUrlInput.value;
        const customCode = customCodeInput.value;
        if (!longUrl) {
            showResult(shortUrlResult, 'Please enter a URL.', false);
            return;
        }
        showLoading(shortUrlResult);
        try {
            const response = await fetch('/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ longUrl, customCode }),
            });
            const data = await response.json();
            if (response.ok) {
                showResult(shortUrlResult, data.url);
                saveToHistory(data.url);
            } else {
                showResult(shortUrlResult, `Error: ${data.error}`, false);
            }
        } catch (error) {
            showResult(shortUrlResult, 'Request failed.', false);
        }
    }

    // History logic
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('linkHistory')) || [];
        historyContainer.innerHTML = '';
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="text-gray-500 text-center">No history yet.</p>';
            return;
        }
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'flex items-center justify-between p-3 bg-white rounded-lg shadow animate-fade-in';
            historyItem.innerHTML = `
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="truncate text-blue-600 font-mono text-sm">${item.url}</a>
                <button class="copy-history-btn p-2 rounded-md hover:bg-gray-200" data-url="${item.url}">
                    <i class="fas fa-copy"></i>
                </button>
            `;
            historyContainer.appendChild(historyItem);
        });
    }

    function saveToHistory(url) {
        let history = JSON.parse(localStorage.getItem('linkHistory')) || [];
        history.unshift({ url, date: new Date().toISOString() });
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        localStorage.setItem('linkHistory', JSON.stringify(history));
        loadHistory();
    }

    historyContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.copy-history-btn');
        if (button) {
            const url = button.dataset.url;
            navigator.clipboard.writeText(url);
            button.innerHTML = '<i class="fas fa-check text-green-500"></i>';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        }
    });

    // Modal logic
    function setupModalListeners() {
        tutorialBtn.addEventListener('click', () => {
            tutorialModal.classList.remove('hidden');
        });

        closeModalBtn.addEventListener('click', () => {
            tutorialModal.classList.add('hidden');
        });

        tutorialModal.addEventListener('click', (e) => {
            if (e.target === tutorialModal) {
                tutorialModal.classList.add('hidden');
            }
        });
    }

    // Initialization
    switchTab('cdn');
    setupEventListeners();
    setupModalListeners();
    loadHistory();
});
