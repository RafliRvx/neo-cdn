// settings.js - Configuration file
// Rename this file to settings.js and fill in your details

const settings = {
  // GitHub Configuration
  github: {
    username: 'RafliRvx',      // Your GitHub username
    repo: 'media',                // Repository name for file storage
    branch: 'main',                        // Branch name (usually 'main')
    token: 'YOUR_GITHUB_TOKEN'             // GitHub Personal Access Token
  },
  
  // Upload Settings
  upload: {
    maxFileSize: 20 * 1024 * 1024,         // 20MB in bytes
    allowedExtensions: [                    // All file types allowed
      'jpg', 'jpeg', 'png', 'gif', 'webp',
      'mp4', 'webm', 'mov', 'avi',
      'mp3', 'wav', 'ogg',
      'pdf', 'txt', 'doc', 'docx',
      'zip', 'rar', '7z'
      // Add more as needed
    ],
    baseUrl: 'https://your-vercel-app.vercel.app'  // Your Vercel app URL
  },
  
  // App Settings
  app: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development'
  }
};

// GitHub API URLs
settings.github.apiUrl = `https://api.github.com/repos/${settings.github.username}/${settings.github.repo}/contents`;
settings.github.rawUrl = `https://raw.githubusercontent.com/${settings.github.username}/${settings.github.repo}/${settings.github.branch}`;
settings.github.repoUrl = `https://github.com/${settings.github.username}/${settings.github.repo}`;

module.exports = settings;
