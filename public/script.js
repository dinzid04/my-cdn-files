document.addEventListener('DOMContentLoaded', () => {
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

    function switchTab(tab) {
        if (tab === 'cdn') {
            cdnSection.classList.remove('hidden');
            shortUrlSection.classList.add('hidden');
            cdnBtn.classList.add('border-blue-500', 'text-blue-600');
            cdnBtn.classList.remove('border-transparent');
            shortUrlBtn.classList.remove('border-blue-500', 'text-blue-600');
            shortUrlBtn.classList.add('border-transparent');
        } else {
            shortUrlSection.classList.remove('hidden');
            cdnSection.classList.add('hidden');
            shortUrlBtn.classList.add('border-blue-500', 'text-blue-600');
            shortUrlBtn.classList.remove('border-transparent');
            cdnBtn.classList.remove('border-blue-500', 'text-blue-600');
            cdnBtn.classList.add('border-transparent');
        }
    }

    cdnBtn.addEventListener('click', () => switchTab('cdn'));
    shortUrlBtn.addEventListener('click', () => switchTab('shorturl'));

    // Initialize the default tab
    switchTab('cdn');

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

    async function handleFileUpload(file) {
        showLoading(cdnResult);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) showResult(cdnResult, data.url);
            else showResult(cdnResult, `Error: ${data.error}`, false);
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
            if (response.ok) showResult(shortUrlResult, data.url);
            else showResult(shortUrlResult, `Error: ${data.error}`, false);
        } catch (error) {
            showResult(shortUrlResult, 'Request failed.', false);
        }
    }
    shortenBtn.addEventListener('click', handleShortenUrl);
});
