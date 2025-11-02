document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    const historyList = document.getElementById('history-list');
    const historyMore = document.getElementById('history-more');
    const historySection = document.querySelector('.history-section');

    const HISTORY_LIMIT_DEFAULT = 5;
    const HISTORY_KEY = 'activityHistory';

    // --- Tab Switching ---
    function switchTab(tabToShow, buttonToActivate) {
        [cdnSection, shortUrlSection].forEach(sec => sec.classList.remove('active'));
        [cdnBtn, shortUrlBtn].forEach(btn => btn.classList.remove('active'));
        buttonToActivate.classList.add('active');
        tabToShow.classList.add('active');
    }

    cdnBtn.addEventListener('click', () => switchTab(cdnSection, cdnBtn));
    shortUrlBtn.addEventListener('click', () => switchTab(shortUrlSection, shortUrlBtn));

    // --- History Management ---
    const getHistory = () => JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    const saveHistory = (data) => {
        let history = getHistory();
        history.unshift(data);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    };

    const renderHistory = (limit) => {
        const history = getHistory();
        historyList.innerHTML = ''; // Clear previous content
        const itemsToShow = history.slice(0, limit);

        if (history.length === 0) {
            historySection.style.display = 'none'; // Hide the whole section if no history
            return;
        }

        historySection.style.display = 'block'; // Show section if there is history

        if (itemsToShow.length === 0) {
             // This case should ideally not be hit if history.length > 0, but as a fallback
            historyList.innerHTML = '<p class="no-history">No activity yet.</p>';
        } else {
            itemsToShow.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = item.html;
                historyList.appendChild(div);
            });
        }

        // Show/hide the "Show All" button
        if (history.length > limit) {
            historyMore.style.display = 'block';
        } else {
            historyMore.style.display = 'none';
        }
    };

    let historyLimit = HISTORY_LIMIT_DEFAULT;
    historyMore.addEventListener('click', () => {
        historyLimit = Infinity; // Set limit to infinity to show all
        renderHistory(historyLimit);
        historyMore.style.display = 'none'; // Hide button after clicking
    });

    // --- Generic UI Functions ---
    const showLoading = (element) => {
        element.innerHTML = '<div class="loader"></div>';
        element.classList.add('visible');
    };

    const showResult = (element, text, isUrl = true) => {
        const svgIcon = `<div class="copy-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
        const textElement = isUrl ? `<a href="${text}" target="_blank" rel="noopener noreferrer" class="result-url">${text}</a>` : `<span>${text}</span>`;
        element.innerHTML = `<div class="result-area-content">${textElement}${svgIcon}</div>`;
        element.classList.add('visible');
        
        const content = element.querySelector('.result-area-content');
        if (content) {
            content.onclick = (e) => {
                if (e.target.tagName === 'A') return;
                if (content.classList.contains('copied')) return;
                navigator.clipboard.writeText(text);
                content.classList.add('copied');
                setTimeout(() => content.classList.remove('copied'), 1500);
            };
        }
    };

    // --- CDN Functionality ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileUpload(fileInput.files[0]);
    });

    async function handleFileUpload(file) {
        showLoading(cdnResult);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                showResult(cdnResult, data.url);
                const historyItem = { html: `<a href="${data.url}" target="_blank" class="history-url">[CDN] ${data.url}</a>`};
                saveHistory(historyItem);
                renderHistory(historyLimit);
            } else {
                showResult(cdnResult, `Error: ${data.error}`, false);
            }
        } catch (error) {
            showResult(cdnResult, 'Upload failed.', false);
        }
    }

    // --- ShortURL Functionality ---
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
                const shortCode = data.url.split('/').pop();
                const historyItem = { html: `<a href="${data.url}" target="_blank" class="history-url">[URL] <strong>${shortCode}</strong> &rarr; ${longUrl}</a>`};
                saveHistory(historyItem);
                renderHistory(historyLimit);
            } else {
                showResult(shortUrlResult, `Error: ${data.error}`, false);
            }
        } catch (error) {
            showResult(shortUrlResult, 'Request failed.', false);
        }
    }
    shortenBtn.addEventListener('click', handleShortenUrl);

    // --- Initial Load ---
    renderHistory(historyLimit);
});
