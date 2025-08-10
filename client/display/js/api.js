// API Client for Family Pane
class API {
  static baseURL = '';
  
  static async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  static async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Configuration endpoints
  static async getDisplayConfig() {
    try {
      const response = await this.get('/config/display');
      return response.config || {};
    } catch (error) {
      console.error('Failed to get display config:', error);
      return {};
    }
  }

  static async updateDisplayConfig(config) {
    return this.post('/config/display', config);
  }

  static async getSystemInfo() {
    return this.get('/config/system/info');
  }

  static async getNetworkDevices() {
    return this.get('/config/network/devices');
  }

  // Calendar endpoints
  static async getCalendarEvents(days = 7) {
    try {
      const response = await this.get(`/calendar/events?days=${days}`);
      return response.events || [];
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }

  static async getCalendars() {
    try {
      const response = await this.get('/calendar/calendars');
      return response.calendars || [];
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  }

  static async createCalendarEvent(event) {
    return this.post('/calendar/events', event);
  }

  // Photos endpoints
  static async getPhotoAlbums() {
    try {
      const response = await this.get('/photos/albums');
      return response.albums || [];
    } catch (error) {
      console.error('Failed to get photo albums:', error);
      return [];
    }
  }

  static async getAlbumPhotos(albumId) {
    try {
      const response = await this.get(`/photos/albums/${albumId}/photos`);
      return response.photos || [];
    } catch (error) {
      console.error('Failed to get album photos:', error);
      return [];
    }
  }

  static async getRandomPhoto() {
    try {
      const response = await this.get('/photos/random');
      return response.photo;
    } catch (error) {
      console.error('Failed to get random photo:', error);
      return null;
    }
  }

  // Chores endpoints
  static async getChores(status = null, assignedTo = null) {
    let endpoint = '/chores';
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (assignedTo) params.append('assignedTo', assignedTo);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    try {
      const response = await this.get(endpoint);
      return response.chores || [];
    } catch (error) {
      console.error('Failed to get chores:', error);
      return [];
    }
  }

  static async createChore(chore) {
    return this.post('/chores', chore);
  }

  static async updateChore(choreId, updates) {
    return this.put(`/chores/${choreId}`, updates);
  }

  static async deleteChore(choreId) {
    return this.delete(`/chores/${choreId}`);
  }

  static async completeChore(choreId, memberId) {
    return this.post(`/chores/${choreId}/complete`, { memberId });
  }

  // Family members endpoints
  static async getFamilyMembers() {
    try {
      const response = await this.get('/chores/members');
      return response.members || [];
    } catch (error) {
      console.error('Failed to get family members:', error);
      return [];
    }
  }

  static async createFamilyMember(member) {
    return this.post('/chores/members', member);
  }

  static async updateFamilyMember(memberId, updates) {
    return this.put(`/chores/members/${memberId}`, updates);
  }

  static async deleteFamilyMember(memberId) {
    return this.delete(`/chores/members/${memberId}`);
  }

  // Authentication endpoints
  static async getAuthStatus() {
    try {
      const response = await this.get('/auth/status');
      return response;
    } catch (error) {
      console.error('Failed to get auth status:', error);
      return { authenticated: false };
    }
  }

  static async logout() {
    return this.post('/auth/logout');
  }

  // Weather endpoints (if implemented)
  static async getWeather(location = null) {
    try {
      let endpoint = '/weather';
      if (location) {
        endpoint += `?location=${encodeURIComponent(location)}`;
      }
      
      const response = await this.get(endpoint);
      return response.weather || null;
    } catch (error) {
      console.error('Failed to get weather:', error);
      return null;
    }
  }

  // Messages endpoints (if implemented)
  static async getMessages() {
    try {
      const response = await this.get('/messages');
      return response.messages || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  static async createMessage(message) {
    return this.post('/messages', message);
  }

  static async deleteMessage(messageId) {
    return this.delete(`/messages/${messageId}`);
  }

  // Utility methods
  static handleError(error) {
    console.error('API Error:', error);
    
    // Show user-friendly error message
    if (window.familyPaneApp) {
      let message = 'An error occurred';
      
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        message = 'Network connection error';
      } else if (error.message.includes('401')) {
        message = 'Authentication required';
      } else if (error.message.includes('403')) {
        message = 'Access denied';
      } else if (error.message.includes('404')) {
        message = 'Resource not found';
      } else if (error.message.includes('500')) {
        message = 'Server error';
      }
      
      window.familyPaneApp.showError(message);
    }
    
    return null;
  }

  static async retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  // Connection status monitoring
  static async checkConnection() {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  static startConnectionMonitoring(interval = 30000) {
    setInterval(async () => {
      const isConnected = await this.checkConnection();
      
      if (window.familyPaneApp) {
        if (isConnected) {
          // Connection is good
          document.body.classList.remove('offline');
        } else {
          // Connection is down
          document.body.classList.add('offline');
          window.familyPaneApp.showError('Connection lost');
        }
      }
    }, interval);
  }
}

// Initialize connection monitoring when the script loads
document.addEventListener('DOMContentLoaded', () => {
  API.startConnectionMonitoring();
});