// Family Pane Main Application
class FamilyPaneApp {
  constructor() {
    this.socket = null;
    this.currentView = 'dashboard';
    this.config = {};
    this.data = {
      calendar: [],
      photos: [],
      chores: [],
      familyMembers: []
    };
    
    this.init();
  }

  async init() {
    try {
      // Initialize Socket.IO connection
      this.initSocket();
      
      // Initialize UI components
      this.initUI();
      
      // Load initial data
      await this.loadInitialData();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      console.log('Family Pane App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Family Pane App:', error);
      this.showError('Failed to initialize application');
    }
  }

  initSocket() {
    this.socket = io();
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.showStatus('Connected', 'success');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.showStatus('Disconnected', 'error');
    });

    this.socket.on('view-changed', (viewName) => {
      this.switchView(viewName);
    });

    this.socket.on('config-changed', (config) => {
      this.updateConfig(config);
    });

    this.socket.on('chore-changed', (choreData) => {
      this.updateChore(choreData);
    });

    this.socket.on('reconnect', () => {
      console.log('Reconnected to server');
      this.loadInitialData();
    });
  }

  initUI() {
    // Initialize time display
    this.updateTimeDisplay();
    setInterval(() => this.updateTimeDisplay(), 1000);

    // View switcher
    const viewSwitcher = document.getElementById('view-switcher');
    const viewMenu = document.getElementById('view-menu');
    
    if (viewSwitcher && viewMenu) {
      viewSwitcher.addEventListener('click', () => {
        viewMenu.style.display = viewMenu.style.display === 'none' ? 'block' : 'none';
      });

      // Hide menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!viewSwitcher.contains(e.target) && !viewMenu.contains(e.target)) {
          viewMenu.style.display = 'none';
        }
      });

      // View option buttons
      const viewOptions = viewMenu.querySelectorAll('.view-option');
      viewOptions.forEach(option => {
        option.addEventListener('click', (e) => {
          const viewName = e.currentTarget.dataset.view;
          this.switchView(viewName);
          viewMenu.style.display = 'none';
        });
      });
    }

    // Settings button
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        // Open admin interface in new window/tab
        window.open('/admin', '_blank');
      });
    }

    // Prevent context menu for kiosk mode
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
  }

  async loadInitialData() {
    try {
      // Load configuration
      this.config = await API.getDisplayConfig();
      
      // Set initial view
      const initialView = this.config.currentView || 'dashboard';
      this.switchView(initialView);

      // Load family members
      this.data.familyMembers = await API.getFamilyMembers();
      
      // Load data based on current view
      await this.loadViewData();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.showError('Failed to load data');
    }
  }

  async loadViewData() {
    try {
      // Load calendar events
      this.data.calendar = await API.getCalendarEvents();
      this.updateCalendarDisplay();

      // Load chores
      this.data.chores = await API.getChores();
      this.updateChoresDisplay();

      // Load photos
      await this.loadRandomPhoto();
      
    } catch (error) {
      console.error('Failed to load view data:', error);
    }
  }

  startPeriodicUpdates() {
    // Update calendar every 5 minutes
    setInterval(() => {
      this.loadViewData();
    }, 5 * 60 * 1000);

    // Update photo every 30 seconds
    setInterval(() => {
      this.loadRandomPhoto();
    }, 30 * 1000);

    // Check for chore updates every minute
    setInterval(() => {
      this.checkChoreUpdates();
    }, 60 * 1000);
  }

  switchView(viewName) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));

    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.add('active');
      this.currentView = viewName;
      
      // Update view switcher icon and menu selection
      this.updateViewSwitcher(viewName);
      
      // Load view-specific data
      this.loadViewData();
      
      // Emit view change to other clients
      this.socket.emit('switch-view', viewName);
      
      console.log('Switched to view:', viewName);
    }
  }

  updateViewSwitcher(viewName) {
    // Update view switcher button icon
    const viewSwitcher = document.getElementById('view-switcher');
    const iconMap = {
      'dashboard': 'dashboard',
      'calendar-photos': 'calendar_view_day',
      'chores': 'task_alt',
      'photos': 'photo_library',
      'messages': 'message'
    };
    
    if (viewSwitcher) {
      const icon = viewSwitcher.querySelector('i');
      if (icon) {
        icon.textContent = iconMap[viewName] || 'dashboard';
      }
    }

    // Update menu selection
    const viewOptions = document.querySelectorAll('.view-option');
    viewOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.view === viewName);
    });
  }

  updateTimeDisplay() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    if (timeElement) {
      timeElement.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    if (dateElement) {
      dateElement.textContent = now.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  updateCalendarDisplay() {
    // Update dashboard calendar widget
    const calendarWidget = document.getElementById('calendar-events');
    if (calendarWidget) {
      if (this.data.calendar.length === 0) {
        calendarWidget.innerHTML = '<p class="no-events">No events today</p>';
      } else {
        calendarWidget.innerHTML = this.data.calendar.slice(0, 3).map(event => `
          <div class="md-list-item">
            <div class="list-item-content">
              <div class="list-item-title">${this.escapeHtml(event.title)}</div>
              <div class="list-item-subtitle">${this.formatEventTime(event.start)}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // Update full calendar view
    const calendarFull = document.getElementById('calendar-full');
    if (calendarFull) {
      if (this.data.calendar.length === 0) {
        calendarFull.innerHTML = '<p class="no-events">No events scheduled</p>';
      } else {
        calendarFull.innerHTML = this.data.calendar.map(event => `
          <div class="md-card mb-16">
            <div class="card-content">
              <div class="card-title">${this.escapeHtml(event.title)}</div>
              <div class="card-subtitle">${this.formatEventTime(event.start)} - ${this.formatEventTime(event.end)}</div>
              ${event.description ? `<p class="mt-8">${this.escapeHtml(event.description)}</p>` : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }

  updateChoresDisplay() {
    // Update dashboard chores widget
    const choresWidget = document.getElementById('chores-list');
    if (choresWidget) {
      const pendingChores = this.data.chores.filter(chore => chore.status === 'pending');
      if (pendingChores.length === 0) {
        choresWidget.innerHTML = '<p class="no-chores">No chores assigned</p>';
      } else {
        choresWidget.innerHTML = pendingChores.slice(0, 3).map(chore => `
          <div class="md-list-item">
            <div class="list-item-content">
              <div class="list-item-title">${this.escapeHtml(chore.title)}</div>
              <div class="list-item-subtitle">${this.getAssigneeName(chore.assigned_to)}</div>
            </div>
            <div class="list-item-trailing">
              <div class="assignee-avatar" style="background-color: ${this.getAssigneeColor(chore.assigned_to)}">
                ${this.getAssigneeInitials(chore.assigned_to)}
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Update chores board
    this.updateChoresBoard();
  }

  updateChoresBoard() {
    const todoList = document.getElementById('todo-chores');
    const progressList = document.getElementById('progress-chores');
    const doneList = document.getElementById('done-chores');

    if (!todoList || !progressList || !doneList) return;

    const choresByStatus = {
      pending: this.data.chores.filter(chore => chore.status === 'pending'),
      'in-progress': this.data.chores.filter(chore => chore.status === 'in-progress'),
      completed: this.data.chores.filter(chore => chore.status === 'completed')
    };

    // Update each column
    todoList.innerHTML = choresByStatus.pending.map(chore => this.createChoreCard(chore)).join('');
    progressList.innerHTML = choresByStatus['in-progress'].map(chore => this.createChoreCard(chore)).join('');
    doneList.innerHTML = choresByStatus.completed.map(chore => this.createChoreCard(chore)).join('');

    // Add click handlers for chore status updates
    this.addChoreClickHandlers();
  }

  createChoreCard(chore) {
    const assignee = this.data.familyMembers.find(member => member.id === chore.assigned_to);
    return `
      <div class="chore-card ${chore.status === 'completed' ? 'completed' : ''}" data-chore-id="${chore.id}">
        <div class="chore-title">${this.escapeHtml(chore.title)}</div>
        <div class="chore-assignee">
          <div class="assignee-avatar" style="background-color: ${assignee?.color || '#757575'}">
            ${assignee ? assignee.name.charAt(0).toUpperCase() : '?'}
          </div>
          <span>${assignee ? assignee.name : 'Unassigned'}</span>
        </div>
      </div>
    `;
  }

  addChoreClickHandlers() {
    const choreCards = document.querySelectorAll('.chore-card');
    choreCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const choreId = parseInt(e.currentTarget.dataset.choreId);
        this.handleChoreClick(choreId);
      });
    });
  }

  async handleChoreClick(choreId) {
    try {
      const chore = this.data.chores.find(c => c.id === choreId);
      if (!chore) return;

      let newStatus;
      switch (chore.status) {
        case 'pending':
          newStatus = 'in-progress';
          break;
        case 'in-progress':
          newStatus = 'completed';
          break;
        case 'completed':
          newStatus = 'pending';
          break;
        default:
          return;
      }

      // Update chore status
      await API.updateChore(choreId, { status: newStatus });
      
      // Update local data
      chore.status = newStatus;
      
      // Refresh display
      this.updateChoresDisplay();
      
      // Emit update to other clients
      this.socket.emit('chore-update', { id: choreId, status: newStatus });
      
      this.showStatus(`Chore ${newStatus === 'completed' ? 'completed' : 'updated'}!`, 'success');
      
    } catch (error) {
      console.error('Failed to update chore:', error);
      this.showError('Failed to update chore');
    }
  }

  async loadRandomPhoto() {
    try {
      const photo = await API.getRandomPhoto();
      if (photo && photo.url) {
        this.updatePhotoDisplay(photo);
      }
    } catch (error) {
      console.error('Failed to load photo:', error);
    }
  }

  updatePhotoDisplay(photo) {
    // Update dashboard photo widget
    const photoDisplay = document.getElementById('photo-display');
    const currentPhoto = document.getElementById('current-photo');
    
    if (photoDisplay && currentPhoto) {
      const placeholder = photoDisplay.querySelector('.photo-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      
      currentPhoto.src = photo.url;
      currentPhoto.alt = photo.title || 'Family Photo';
      currentPhoto.style.display = 'block';
      
      // Add fade effect
      currentPhoto.style.opacity = '0';
      setTimeout(() => {
        currentPhoto.style.opacity = '1';
      }, 100);
    }

    // Update slideshow in split view
    const slideshowPhoto = document.getElementById('slideshow-photo');
    const photoTitle = document.getElementById('photo-title');
    
    if (slideshowPhoto) {
      slideshowPhoto.src = photo.url;
      slideshowPhoto.alt = photo.title || 'Family Photo';
    }
    
    if (photoTitle) {
      photoTitle.textContent = photo.title || '';
    }

    // Update fullscreen photo view
    const fullscreenPhoto = document.getElementById('fullscreen-photo-img');
    const fullscreenTitle = document.getElementById('fullscreen-photo-title');
    
    if (fullscreenPhoto) {
      fullscreenPhoto.src = photo.url;
      fullscreenPhoto.alt = photo.title || 'Family Photo';
    }
    
    if (fullscreenTitle) {
      fullscreenTitle.textContent = photo.title || '';
    }
  }

  // Helper methods
  getAssigneeName(memberId) {
    const member = this.data.familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unassigned';
  }

  getAssigneeColor(memberId) {
    const member = this.data.familyMembers.find(m => m.id === memberId);
    return member ? member.color : '#757575';
  }

  getAssigneeInitials(memberId) {
    const member = this.data.familyMembers.find(m => m.id === memberId);
    return member ? member.name.charAt(0).toUpperCase() : '?';
  }

  formatEventTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
    
    // Apply configuration changes
    if (config.currentView && config.currentView !== this.currentView) {
      this.switchView(config.currentView);
    }
  }

  updateChore(choreData) {
    // Update local chore data
    const choreIndex = this.data.chores.findIndex(c => c.id === choreData.id);
    if (choreIndex !== -1) {
      this.data.chores[choreIndex] = { ...this.data.chores[choreIndex], ...choreData };
      this.updateChoresDisplay();
    }
  }

  async checkChoreUpdates() {
    try {
      const updatedChores = await API.getChores();
      this.data.chores = updatedChores;
      this.updateChoresDisplay();
    } catch (error) {
      console.error('Failed to check chore updates:', error);
    }
  }

  showStatus(message, type = 'info') {
    // Create and show a temporary status message
    const statusDiv = document.createElement('div');
    statusDiv.className = `md-snackbar show ${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);

    setTimeout(() => {
      statusDiv.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(statusDiv);
      }, 300);
    }, 3000);
  }

  showError(message) {
    this.showStatus(message, 'error');
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContainer = document.getElementById('main-container');
    
    if (loadingScreen && mainContainer) {
      loadingScreen.style.display = 'none';
      mainContainer.style.display = 'flex';
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.familyPaneApp = new FamilyPaneApp();
});