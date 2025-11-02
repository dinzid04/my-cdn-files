document.addEventListener('DOMContentLoaded', () => {
    // API Docs Interaction
    document.querySelectorAll('.try-it-out-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const details = e.target.closest('.details');
            const tryItOutSection = details.querySelector('.try-it-out-section');
            const isVisible = tryItOutSection.style.display === 'block';
            tryItOutSection.style.display = isVisible ? 'none' : 'block';
            e.target.textContent = isVisible ? 'Try it out' : 'Cancel';
        });
    });

    document.querySelectorAll('.copy-curl-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const curlExampleDiv = e.currentTarget.closest('.curl-example');
            const curlCommand = curlExampleDiv.querySelector('.curl-command').textContent;
            navigator.clipboard.writeText(curlCommand);

            const originalTooltip = e.currentTarget.title;
            e.currentTarget.title = 'Copied!';
            setTimeout(() => {
                e.currentTarget.title = originalTooltip;
            }, 1500);
        });
    });

    document.querySelectorAll('.execute-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const endpointDiv = e.target.closest('.api-endpoint');
            const path = endpointDiv.dataset.path;
            const method = endpointDiv.dataset.method.toUpperCase();

            const responseArea = endpointDiv.querySelector('.response-area');
            const responseCodeEl = endpointDiv.querySelector('.response-code');
            const responseBodyEl = endpointDiv.querySelector('.response-body code');

            responseCodeEl.textContent = 'Fetching...';
            responseBodyEl.textContent = '';
            responseArea.style.display = 'block';

            let requestPath = path;
            const inputs = endpointDiv.querySelectorAll('.api-input');
            let body;
            const headers = {};

            const pathParams = Array.from(inputs).filter(i => i.placeholder && i.placeholder.includes('(path)'));
            pathParams.forEach(p => {
                requestPath = requestPath.replace(`{${p.name}}`, p.value);
            });

            if (method === 'POST') {
                const fileInput = endpointDiv.querySelector('input[type="file"]');
                const jsonTextarea = endpointDiv.querySelector('textarea[name="json-body"]');

                if (fileInput) { // multipart/form-data
                    body = new FormData();
                    if (fileInput.files[0]) {
                        body.append(fileInput.name, fileInput.files[0]);
                    }
                } else if (jsonTextarea) { // application/json
                    headers['Content-Type'] = 'application/json';
                    body = jsonTextarea.value;
                }
            }

            try {
                const response = await fetch(requestPath, { method, headers, body });
                const responseData = await response.json();

                responseCodeEl.textContent = `Status: ${response.status}`;
                responseBodyEl.textContent = JSON.stringify(responseData, null, 2);

            } catch (error) {
                responseCodeEl.textContent = 'Error';
                responseBodyEl.textContent = error.toString();
            }
        });
    });
});
