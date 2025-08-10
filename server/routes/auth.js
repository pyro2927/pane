const express = require('express');
const router = express.Router();
const googleAuth = require('../services/google-auth');

// Helper function to get user ID from session or default
function getUserId(req) {
  return req.session?.userId || 'default';
}

/**
 * GET /auth/status
 * Check authentication status
 */
router.get('/status', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const status = {
      authenticated: googleAuth.isAuthenticated(userId),
      googleAvailable: googleAuth.isAvailable(),
      userId: userId,
      sessionActive: !!req.session?.userId
    };

    // If authenticated, try to get user info
    if (status.authenticated) {
      try {
        const userInfo = await googleAuth.getUserInfo(userId);
        status.userInfo = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
      } catch (error) {
        console.warn('Failed to get user info:', error.message);
        // Authentication might be stale, mark as not authenticated
        status.authenticated = false;
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Auth status check failed:', error);
    res.status(500).json({
      error: 'Failed to check authentication status',
      authenticated: false,
      googleAvailable: false
    });
  }
});

/**
 * GET /auth/google
 * Start Google OAuth flow
 */
router.get('/google', (req, res) => {
  try {
    if (!googleAuth.isAvailable()) {
      return res.status(503).json({
        error: 'Google authentication not configured',
        message: 'Please configure Google OAuth credentials in .env or credentials.json'
      });
    }

    const userId = getUserId(req);
    const authUrl = googleAuth.getAuthUrl(userId);
    
    // Store state in session for security
    req.session.oauthState = userId;
    
    // For AJAX requests, return JSON with URL
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ authUrl });
    } else {
      // For direct navigation, redirect
      res.redirect(authUrl);
    }
  } catch (error) {
    console.error('Failed to start Google auth:', error);
    res.status(500).json({
      error: 'Failed to start authentication process',
      message: error.message
    });
  }
});

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`/?error=oauth_${error}`);
    }

    if (!code) {
      return res.redirect('/?error=no_auth_code');
    }

    // Verify state parameter for CSRF protection
    let userId = 'default';
    if (state) {
      try {
        const stateData = JSON.parse(state);
        userId = stateData.userId || 'default';
      } catch (parseError) {
        console.warn('Could not parse OAuth state:', parseError.message);
      }
    }

    // Verify session state matches (additional security)
    if (req.session.oauthState && req.session.oauthState !== userId) {
      console.warn('OAuth state mismatch');
      return res.redirect('/?error=state_mismatch');
    }

    // Exchange code for tokens
    const tokens = await googleAuth.getToken(code, userId);
    
    // Store user ID in session
    req.session.userId = userId;
    req.session.authenticated = true;
    
    // Clear OAuth state
    delete req.session.oauthState;

    console.log(`✅ User ${userId} authenticated successfully`);
    
    // Redirect to dashboard with success message
    res.redirect('/?auth=success');
    
  } catch (error) {
    console.error('OAuth callback failed:', error);
    res.redirect('/?error=auth_failed');
  }
});

/**
 * POST /auth/logout
 * Logout and revoke tokens
 */
router.post('/logout', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Revoke Google tokens if authenticated
    if (googleAuth.isAuthenticated(userId)) {
      await googleAuth.revokeTokens(userId);
    }
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction failed:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      console.log(`🚪 User ${userId} logged out`);
      res.json({ success: true, message: 'Logged out successfully' });
    });
    
  } catch (error) {
    console.error('Logout failed:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

/**
 * GET /auth/google/test
 * Test Google API access (development endpoint)
 */
router.get('/google/test', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!googleAuth.isAuthenticated(userId)) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please authenticate with Google first'
      });
    }

    // Test Calendar API access
    const calendar = await googleAuth.getCalendarService(userId);
    const calendarsResponse = await calendar.calendarList.list({
      maxResults: 5
    });

    // Test Photos API access (basic profile info)
    let photosInfo = null;
    try {
      const userInfo = await googleAuth.getUserInfo(userId);
      photosInfo = {
        hasAccess: true,
        userEmail: userInfo.email
      };
    } catch (photosError) {
      photosInfo = {
        hasAccess: false,
        error: photosError.message
      };
    }

    res.json({
      success: true,
      calendar: {
        hasAccess: true,
        calendarsCount: calendarsResponse.data.items?.length || 0,
        calendars: calendarsResponse.data.items?.map(cal => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary
        })) || []
      },
      photos: photosInfo
    });

  } catch (error) {
    console.error('Google API test failed:', error);
    res.status(500).json({
      error: 'API test failed',
      message: error.message,
      details: error.errors || []
    });
  }
});

module.exports = router;