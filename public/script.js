// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const uploadButton = document.getElementById('uploadButton');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultCard = document.getElementById('resultCard');
const uploadCard = document.querySelector('.upload-card');
const fileUrl = document.getElementById('fileUrl');
const copyButton = document.getElementById('copyButton');
const previewButton = document.getElementById('previewButton');
const newUploadButton = document.getElementById('newUploadButton');
const resultFilename = document.getElementById('resultFilename');
const resultSize = document.getElementById('resultSize');
const resultTime = document.getElementById('resultTime');
const resultId = document.getElementById('resultId');
const notification = document.getElementById('notification');

// State
let currentFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showNotification('Welcome to NEO-CDN! Select a file to begin.', 'info');
});

// Event Listeners
function setupEventListeners() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    
    // Upload button
    uploadButton.addEventListener('click', handleUpload);
    
    // Copy button
    copyButton.addEventListener('click', copyToClipboard);
    
    // New upload button
    newUploadButton.addEventListener('click', resetUpload);
    
    // Click upload zone to trigger file input
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
}

// File selection handler
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadZone.style.background = 'rgba(255, 71, 87, 0.15)';
    uploadZone.style.transform = 'translateY(-4px)';
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.style.background = 'rgba(255, 71, 87, 0.05)';
    uploadZone.style.transform = 'translateY(0)';
}

function handleDrop(e) {
    e.preventDefault();
    handleDragLeave(e);
    
    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
}

// Process selected file
function processFile(file) {
    // Validate file size (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('File size exceeds 20MB limit!', 'error');
        return;
    }
    
    currentFile = file;
    
    // Display file info
    fileInfo.innerHTML = `
        <div class="file-details">
            <div class="detail-row">
                <i class="fas fa-file"></i>
                <span class="detail-label">File:</span>
                <span class="detail-value">${file.name}</span>
            </div>
            <div class="detail-row">
                <i class="fas fa-weight-hanging"></i>
                <span class="detail-label">Size:</span>
                <span class="detail-value">${formatFileSize(file.size)}</span>
            </div>
            <div class="detail-row">
                <i class="fas fa-cube"></i>
                <span class="detail-label">Type:</span>
                <span class="detail-value">${file.type || 'Unknown'}</span>
            </div>
        </div>
    `;
    
    fileInfo.style.display = 'block';
    uploadButton.disabled = false;
    
    // Auto-upload after 1 second
    setTimeout(() => {
        handleUpload();
    }, 1000);
}

// Upload file to server
async function handleUpload() {
    if (!currentFile) return;
    
    // Show progress bar
    uploadProgress.style.display = 'block';
    uploadButton.disabled = true;
    
    // Simulate progress
    simulateProgress();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', currentFile);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Complete progress
            progressBar.style.width = '100%';
            progressText.textContent = '100%';
            
            // Show result after delay
            setTimeout(() => {
                showResult(data);
                showNotification('File uploaded successfully!', 'success');
            }, 500);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        resetProgress();
    }
}

// Show upload result
function showResult(data) {
    // Update result elements
    fileUrl.value = data.url;
    resultFilename.textContent = data.originalName;
    resultSize.textContent = formatFileSize(data.size);
    resultTime.textContent = formatDateTime(data.timestamp);
    resultId.textContent = data.id;
    
    // Update preview button
    previewButton.href = data.url;
    
    // Switch cards
    uploadCard.style.display = 'none';
    resultCard.style.display = 'block';
    
    // Reset for next upload
    resetProgress();
}

// Reset upload form
function resetUpload() {
    uploadCard.style.display = 'block';
    resultCard.style.display = 'none';
    
    // Reset file input
    fileInput.value = '';
    fileInfo.style.display = 'none';
    currentFile = null;
    uploadButton.disabled = true;
    
    showNotification('Ready for new upload!', 'info');
}

// Copy URL to clipboard
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(fileUrl.value);
        showNotification('URL copied to clipboard!', 'success');
        
        // Visual feedback
        copyButton.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    } catch (error) {
        showNotification('Failed to copy URL', 'error');
    }
}

// Progress simulation
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) {
            clearInterval(interval);
            progress = 90;
        }
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }, 200);
}

// Reset progress
function resetProgress() {
    uploadProgress.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
}

// Show notification
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = 'notification';
    
    // Set color based on type
    if (type === 'success') {
        notification.style.borderColor = '#2ed573';
    } else if (type === 'error') {
        notification.style.borderColor = '#ff4757';
    } else {
        notification.style.borderColor = '#000000';
    }
    
    notification.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Add some CSS for file details
const style = document.createElement('style');
style.textContent = `
    .file-details {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .detail-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    .detail-row:last-child {
        border-bottom: none;
    }
    
    .detail-row i {
        color: #ff4757;
        width: 20px;
        text-align: center;
    }
    
    .detail-label {
        font-weight: 600;
        min-width: 50px;
        color: rgba(0,0,0,0.7);
    }
    
    .detail-value {
        font-weight: 500;
        color: #000000;
        font-family: 'Space Grotesk', monospace;
        word-break: break-all;
    }
`;
document.head.appendChild(style);
