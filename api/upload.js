const express = require('express');
const multer = require('multer');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const settings = require('../settings.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Generate random ID
function generateRandomId(length = 8) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: settings.upload.maxFileSize
  }
});

// Initialize mappings
async function initializeMappings() {
  try {
    // Try to load existing mappings from GitHub
    const response = await axios.get(
      `${settings.github.apiUrl}/mappings.json?ref=${settings.github.branch}`,
      {
        headers: {
          'Authorization': `token ${settings.github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    
    const content = Buffer.from(response.data.content, 'base64').toString();
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist, create empty mappings
    if (error.response && error.response.status === 404) {
      return {};
    }
    throw error;
  }
}

// Save file to GitHub
async function saveToGitHub(filename, content, message) {
  const response = await axios.put(
    `${settings.github.apiUrl}/${filename}`,
    {
      message: message,
      content: Buffer.from(content).toString('base64'),
      branch: settings.github.branch
    },
    {
      headers: {
        'Authorization': `token ${settings.github.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Update mappings
async function updateMappings(mappings) {
  await saveToGitHub(
    'mappings.json',
    JSON.stringify(mappings, null, 2),
    'Update file mappings'
  );
}

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file size
    if (req.file.size > settings.upload.maxFileSize) {
      return res.status(400).json({ 
        error: `File size exceeds ${settings.upload.maxFileSize / (1024 * 1024)}MB limit` 
      });
    }

    // Generate unique ID and get file extension
    const originalName = req.file.originalname;
    const extension = path.extname(originalName).toLowerCase().slice(1) || 'bin';
    const randomId = generateRandomId();
    const filename = `${randomId}.${extension}`;

    // Load existing mappings
    const mappings = await initializeMappings();

    // Prepare file data
    const fileData = {
      id: randomId,
      originalName: originalName,
      extension: extension,
      filename: filename,
      uploadTime: new Date().toISOString(),
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    // Save file to GitHub
    await saveToGitHub(
      filename,
      req.file.buffer,
      `Upload: ${originalName} -> ${filename}`
    );

    // Update mappings
    mappings[randomId] = fileData;
    await updateMappings(mappings);

    // Return success response
    const fileUrl = `${settings.upload.baseUrl}/${filename}`;
    
    res.json({
      success: true,
      id: randomId,
      filename: filename,
      url: fileUrl,
      originalName: originalName,
      size: req.file.size,
      timestamp: fileData.uploadTime
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// File retrieval endpoint
app.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const id = path.parse(filename).name;
    
    // Load mappings
    const mappings = await initializeMappings();
    
    if (!mappings[id]) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Redirect to GitHub raw URL
    const redirectUrl = `${settings.github.rawUrl}/${filename}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'File retrieval failed' });
  }
});

// Get file info endpoint
app.get('/api/info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mappings = await initializeMappings();
    
    if (!mappings[id]) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(mappings[id]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const port = settings.app.port;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Upload limit: ${settings.upload.maxFileSize / (1024 * 1024)}MB`);
  });
}
