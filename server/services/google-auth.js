const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleAuthService {
  constructor() {
    this.oauth2Client = null;
    this.credentials = null;
    this.tokens = new Map(); // Store user tokens
    this.init();
  }

  async init() {
    try {
      // Load OAuth2 credentials
      await this.loadCredentials();
      
      // Initialize OAuth2 client
      if (this.credentials) {
        this.oauth2Client = new google.auth.OAuth2(
          this.credentials.client_id,
          this.credentials.client_secret,
          this.credentials.redirect_uris[0] || process.env.GOOGLE_REDIRECT_URI
        );

        // Set up refresh token handling
        this.oauth2Client.on('tokens', (tokens) => {
          this.handleTokenRefresh(tokens);
        });
      }
    } catch (error) {
      console.warn('Google Auth Service initialization failed:', error.message);
      console.warn('Google integrations will be disabled');
    }
  }

  async loadCredentials() {
    try {
      // First try to load from credentials.json file
      const credentialsPath = path.join(__dirname, '../../config/credentials.json');
      const credentialsFile = await fs.readFile(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsFile);
      
      // Support both web and installed app credential formats
      this.credentials = credentials.web || credentials.installed;
      
      if (!this.credentials) {
        throw new Error('Invalid credentials format');
      }
      
      console.log('✅ Google credentials loaded from file');
    } catch (fileError) {
      // Fallback to environment variables
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        this.credentials = {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/auth/google/callback']
        };
        console.log('✅ Google credentials loaded from environment');
      } else {
        throw new Error('No Google credentials found in file or environment');
      }
    }
  }

  getAuthUrl(userId = 'default') {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    const scopes = process.env.GOOGLE_SCOPES?.split(',') || [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/photoslibrary.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: JSON.stringify({ userId })
    });
  }

  async getToken(authorizationCode, userId = 'default') {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(authorizationCode);
      
      // Store tokens for this user
      this.tokens.set(userId, tokens);
      
      // Save tokens to file for persistence
      await this.saveTokens(userId, tokens);
      
      console.log(`✅ Google tokens obtained for user: ${userId}`);
      return tokens;
    } catch (error) {
      console.error('Failed to get Google tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  async saveTokens(userId, tokens) {
    try {
      const configDir = path.join(__dirname, '../../config');
      await fs.mkdir(configDir, { recursive: true });
      
      const tokensPath = path.join(configDir, `tokens-${userId}.json`);
      await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2));
      
      console.log(`💾 Tokens saved for user: ${userId}`);
    } catch (error) {
      console.warn('Failed to save tokens to file:', error.message);
    }
  }

  async loadTokens(userId = 'default') {
    try {
      const tokensPath = path.join(__dirname, `../../config/tokens-${userId}.json`);
      const tokensFile = await fs.readFile(tokensPath, 'utf8');
      const tokens = JSON.parse(tokensFile);
      
      this.tokens.set(userId, tokens);
      console.log(`📥 Tokens loaded for user: ${userId}`);
      return tokens;
    } catch (error) {
      console.warn(`No saved tokens found for user: ${userId}`);
      return null;
    }
  }

  getAuthenticatedClient(userId = 'default') {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth client not initialized');
    }

    const tokens = this.tokens.get(userId);
    if (!tokens) {
      throw new Error(`No tokens found for user: ${userId}`);
    }

    // Create a new client instance for this user
    const userClient = new google.auth.OAuth2(
      this.credentials.client_id,
      this.credentials.client_secret,
      this.credentials.redirect_uris[0] || process.env.GOOGLE_REDIRECT_URI
    );

    userClient.setCredentials(tokens);
    
    // Set up token refresh handling
    userClient.on('tokens', (newTokens) => {
      this.handleTokenRefresh(newTokens, userId);
    });

    return userClient;
  }

  async handleTokenRefresh(tokens, userId = 'default') {
    console.log(`🔄 Refreshing tokens for user: ${userId}`);
    
    // Update stored tokens
    const existingTokens = this.tokens.get(userId) || {};
    const updatedTokens = { ...existingTokens, ...tokens };
    this.tokens.set(userId, updatedTokens);
    
    // Save updated tokens
    await this.saveTokens(userId, updatedTokens);
  }

  async revokeTokens(userId = 'default') {
    try {
      const tokens = this.tokens.get(userId);
      if (!tokens) {
        console.warn(`No tokens to revoke for user: ${userId}`);
        return;
      }

      if (tokens.access_token) {
        await this.oauth2Client.revokeToken(tokens.access_token);
      }
      
      // Remove from memory
      this.tokens.delete(userId);
      
      // Remove from file
      const tokensPath = path.join(__dirname, `../../config/tokens-${userId}.json`);
      try {
        await fs.unlink(tokensPath);
      } catch (unlinkError) {
        // File might not exist, that's okay
      }
      
      console.log(`🗑️ Tokens revoked for user: ${userId}`);
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
      throw error;
    }
  }

  isAuthenticated(userId = 'default') {
    const tokens = this.tokens.get(userId);
    return !!(tokens && tokens.access_token);
  }

  async getCalendarService(userId = 'default') {
    const auth = this.getAuthenticatedClient(userId);
    return google.calendar({ version: 'v3', auth });
  }

  async getPhotosService(userId = 'default') {
    const auth = this.getAuthenticatedClient(userId);
    return google.photoslibrary({ version: 'v1', auth });
  }

  // Utility method to check if service is available
  isAvailable() {
    return !!(this.oauth2Client && this.credentials);
  }

  // Get user info for display purposes
  async getUserInfo(userId = 'default') {
    try {
      const auth = this.getAuthenticatedClient(userId);
      const oauth2 = google.oauth2({ version: 'v2', auth });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new GoogleAuthService();