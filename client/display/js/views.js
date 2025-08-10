// View Management for Family Pane
class ViewManager {
  constructor() {
    this.views = new Map();
    this.currentView = null;
    this.viewTransitions = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    };
    
    this.init();
  }

  init() {
    // Register all views
    this.registerView('dashboard', new DashboardView());
    this.registerView('calendar-photos', new CalendarPhotosView());
    this.registerView('chores', new ChoresView());
    this.registerView('photos', new PhotosView());
    this.registerView('messages', new MessagesView());

    // Set up view transition animations
    this.setupTransitions();
  }

  registerView(name, viewInstance) {
    this.views.set(name, viewInstance);
  }

  async switchView(viewName, data = null) {
    const view = this.views.get(viewName);
    if (!view) {
      console.error('View not found:', viewName);
      return;
    }

    // Exit current view
    if (this.currentView) {
      await this.views.get(this.currentView).exit();
    }

    // Update DOM
    const viewElements = document.querySelectorAll('.view');
    viewElements.forEach(el => el.classList.remove('active'));
    
    const targetElement = document.getElementById(`${viewName}-view`);
    if (targetElement) {
      targetElement.classList.add('active');
    }

    // Enter new view
    await view.enter(data);
    
    this.currentView = viewName;
    console.log('Switched to view:', viewName);
  }

  getCurrentView() {
    return this.currentView;
  }

  getView(name) {
    return this.views.get(name);
  }

  setupTransitions() {
    const style = document.createElement('style');
    style.textContent = `
      .view-transition {
        transition: all ${this.viewTransitions.duration}ms ${this.viewTransitions.easing};
      }

      .view-slide-in {
        transform: translateX(100%);
        opacity: 0;
      }

      .view-slide-in.active {
        transform: translateX(0);
        opacity: 1;
      }

      .view-slide-out {
        transform: translateX(-100%);
        opacity: 0;
      }

      .view-fade-in {
        opacity: 0;
      }

      .view-fade-in.active {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }
}

// Base View Class
class BaseView {
  constructor(elementId) {
    this.elementId = elementId;
    this.element = document.getElementById(elementId);
    this.isActive = false;
    this.data = {};
  }

  async enter(data = null) {
    this.isActive = true;
    this.data = data || {};
    await this.onEnter();
    await this.loadData();
    this.setupEventListeners();
  }

  async exit() {
    this.isActive = false;
    this.removeEventListeners();
    await this.onExit();
  }

  async onEnter() {
    // Override in subclasses
  }

  async onExit() {
    // Override in subclasses
  }

  async loadData() {
    // Override in subclasses
  }

  setupEventListeners() {
    // Override in subclasses
  }

  removeEventListeners() {
    // Override in subclasses
  }

  updateDisplay() {
    // Override in subclasses
  }
}

// Dashboard View
class DashboardView extends BaseView {
  constructor() {
    super('dashboard-view');
    this.updateInterval = null;
  }

  async onEnter() {
    console.log('Entering dashboard view');
    this.startPeriodicUpdates();
  }

  async onExit() {
    console.log('Exiting dashboard view');
    this.stopPeriodicUpdates();
  }

  async loadData() {
    try {
      // Load weather data
      await this.loadWeather();
      
      // Load calendar events
      await this.loadCalendarEvents();
      
      // Load chores
      await this.loadChores();
      
      // Load photo
      await this.loadPhoto();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  async loadWeather() {
    try {
      const weather = await API.getWeather();
      const weatherWidget = this.element.querySelector('.weather-widget .widget-content');
      
      if (weather && weatherWidget) {
        weatherWidget.innerHTML = `
          <div class="weather-current">
            <span class="temperature">${weather.temperature}°</span>
            <span class="condition">${weather.condition}</span>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to load weather:', error);
    }
  }

  async loadCalendarEvents() {
    try {
      const events = await API.getCalendarEvents(1); // Today's events
      const calendarWidget = this.element.querySelector('#calendar-events');
      
      if (calendarWidget) {
        if (events.length === 0) {
          calendarWidget.innerHTML = '<p class="no-events">No events today</p>';
        } else {
          calendarWidget.innerHTML = events.slice(0, 3).map(event => `
            <div class="md-list-item">
              <div class="list-item-content">
                <div class="list-item-title">${this.escapeHtml(event.title)}</div>
                <div class="list-item-subtitle">${this.formatTime(event.start)}</div>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  }

  async loadChores() {
    try {
      const chores = await API.getChores('pending');
      const choresWidget = this.element.querySelector('#chores-list');
      
      if (choresWidget) {
        if (chores.length === 0) {
          choresWidget.innerHTML = '<p class="no-chores">No chores assigned</p>';
        } else {
          const members = await API.getFamilyMembers();
          choresWidget.innerHTML = chores.slice(0, 3).map(chore => {
            const member = members.find(m => m.id === chore.assigned_to);
            return `
              <div class="md-list-item">
                <div class="list-item-content">
                  <div class="list-item-title">${this.escapeHtml(chore.title)}</div>
                  <div class="list-item-subtitle">${member ? member.name : 'Unassigned'}</div>
                </div>
                <div class="list-item-trailing">
                  <div class="assignee-avatar" style="background-color: ${member?.color || '#757575'}">
                    ${member ? member.name.charAt(0).toUpperCase() : '?'}
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load chores:', error);
    }
  }

  async loadPhoto() {
    try {
      const photo = await API.getRandomPhoto();
      const photoDisplay = this.element.querySelector('#photo-display');
      const currentPhoto = this.element.querySelector('#current-photo');
      
      if (photo && photoDisplay && currentPhoto) {
        const placeholder = photoDisplay.querySelector('.photo-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
        
        currentPhoto.src = photo.url;
        currentPhoto.alt = photo.title || 'Family Photo';
        currentPhoto.style.display = 'block';
      }
    } catch (error) {
      console.error('Failed to load photo:', error);
    }
  }

  startPeriodicUpdates() {
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      if (this.isActive) {
        this.loadData();
      }
    }, 5 * 60 * 1000);
  }

  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Calendar + Photos Split View
class CalendarPhotosView extends BaseView {
  constructor() {
    super('calendar-photos-view');
    this.photoRotationInterval = null;
  }

  async onEnter() {
    console.log('Entering calendar+photos view');
    this.startPhotoRotation();
  }

  async onExit() {
    console.log('Exiting calendar+photos view');
    this.stopPhotoRotation();
  }

  async loadData() {
    await Promise.all([
      this.loadCalendarEvents(),
      this.loadPhoto()
    ]);
  }

  async loadCalendarEvents() {
    try {
      const events = await API.getCalendarEvents(7);
      const calendarFull = this.element.querySelector('#calendar-full');
      
      if (calendarFull) {
        if (events.length === 0) {
          calendarFull.innerHTML = '<p class="no-events">No events scheduled</p>';
        } else {
          calendarFull.innerHTML = events.map(event => `
            <div class="md-card mb-16">
              <div class="card-content">
                <div class="card-title">${this.escapeHtml(event.title)}</div>
                <div class="card-subtitle">${this.formatDateTime(event.start)} - ${this.formatDateTime(event.end)}</div>
                ${event.description ? `<p class="mt-8">${this.escapeHtml(event.description)}</p>` : ''}
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  }

  async loadPhoto() {
    try {
      const photo = await API.getRandomPhoto();
      const slideshowPhoto = this.element.querySelector('#slideshow-photo');
      const photoTitle = this.element.querySelector('#photo-title');
      
      if (photo && slideshowPhoto) {
        slideshowPhoto.src = photo.url;
        slideshowPhoto.alt = photo.title || 'Family Photo';
        
        if (photoTitle) {
          photoTitle.textContent = photo.title || '';
        }
      }
    } catch (error) {
      console.error('Failed to load photo:', error);
    }
  }

  startPhotoRotation() {
    // Rotate photos every 30 seconds
    this.photoRotationInterval = setInterval(() => {
      if (this.isActive) {
        this.loadPhoto();
      }
    }, 30 * 1000);
  }

  stopPhotoRotation() {
    if (this.photoRotationInterval) {
      clearInterval(this.photoRotationInterval);
      this.photoRotationInterval = null;
    }
  }

  formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Chores Board View
class ChoresView extends BaseView {
  constructor() {
    super('chores-view');
    this.choreClickHandlers = [];
  }

  async loadData() {
    try {
      const [chores, members] = await Promise.all([
        API.getChores(),
        API.getFamilyMembers()
      ]);

      this.chores = chores;
      this.members = members;
      this.updateChoresBoard();
    } catch (error) {
      console.error('Failed to load chores data:', error);
    }
  }

  updateChoresBoard() {
    const todoList = this.element.querySelector('#todo-chores');
    const progressList = this.element.querySelector('#progress-chores');
    const doneList = this.element.querySelector('#done-chores');

    if (!todoList || !progressList || !doneList) return;

    const choresByStatus = {
      pending: this.chores.filter(chore => chore.status === 'pending'),
      'in-progress': this.chores.filter(chore => chore.status === 'in-progress'),
      completed: this.chores.filter(chore => chore.status === 'completed')
    };

    todoList.innerHTML = choresByStatus.pending.map(chore => this.createChoreCard(chore)).join('');
    progressList.innerHTML = choresByStatus['in-progress'].map(chore => this.createChoreCard(chore)).join('');
    doneList.innerHTML = choresByStatus.completed.map(chore => this.createChoreCard(chore)).join('');

    this.setupChoreHandlers();
  }

  createChoreCard(chore) {
    const assignee = this.members.find(member => member.id === chore.assigned_to);
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

  setupChoreHandlers() {
    // Remove old handlers
    this.choreClickHandlers.forEach(handler => {
      handler.element.removeEventListener('click', handler.fn);
    });
    this.choreClickHandlers = [];

    // Add new handlers
    const choreCards = this.element.querySelectorAll('.chore-card');
    choreCards.forEach(card => {
      const handler = {
        element: card,
        fn: (e) => this.handleChoreClick(e)
      };
      
      card.addEventListener('click', handler.fn);
      this.choreClickHandlers.push(handler);
    });
  }

  async handleChoreClick(event) {
    const choreId = parseInt(event.currentTarget.dataset.choreId);
    const chore = this.chores.find(c => c.id === choreId);
    
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

    try {
      await API.updateChore(choreId, { status: newStatus });
      chore.status = newStatus;
      this.updateChoresBoard();
      
      if (window.familyPaneApp) {
        window.familyPaneApp.showStatus(`Chore ${newStatus === 'completed' ? 'completed' : 'updated'}!`, 'success');
      }
    } catch (error) {
      console.error('Failed to update chore:', error);
      if (window.familyPaneApp) {
        window.familyPaneApp.showError('Failed to update chore');
      }
    }
  }

  removeEventListeners() {
    this.choreClickHandlers.forEach(handler => {
      handler.element.removeEventListener('click', handler.fn);
    });
    this.choreClickHandlers = [];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Photo Frame View
class PhotosView extends BaseView {
  constructor() {
    super('photos-view');
    this.photoInterval = null;
  }

  async onEnter() {
    console.log('Entering photos view');
    this.startPhotoSlideshow();
  }

  async onExit() {
    console.log('Exiting photos view');
    this.stopPhotoSlideshow();
  }

  async loadData() {
    await this.loadPhoto();
  }

  async loadPhoto() {
    try {
      const photo = await API.getRandomPhoto();
      const photoImg = this.element.querySelector('#fullscreen-photo-img');
      const photoTitle = this.element.querySelector('#fullscreen-photo-title');
      
      if (photo && photoImg) {
        photoImg.src = photo.url;
        photoImg.alt = photo.title || 'Family Photo';
        
        if (photoTitle) {
          photoTitle.textContent = photo.title || '';
        }
      }
    } catch (error) {
      console.error('Failed to load photo:', error);
    }
  }

  startPhotoSlideshow() {
    // Change photo every 10 seconds in fullscreen mode
    this.photoInterval = setInterval(() => {
      if (this.isActive) {
        this.loadPhoto();
      }
    }, 10 * 1000);
  }

  stopPhotoSlideshow() {
    if (this.photoInterval) {
      clearInterval(this.photoInterval);
      this.photoInterval = null;
    }
  }
}

// Messages View
class MessagesView extends BaseView {
  constructor() {
    super('messages-view');
  }

  async loadData() {
    try {
      const messages = await API.getMessages();
      const messagesContainer = this.element.querySelector('#messages-container');
      
      if (messagesContainer) {
        if (messages.length === 0) {
          messagesContainer.innerHTML = '<p>No messages yet. Use the admin interface to add family announcements.</p>';
        } else {
          messagesContainer.innerHTML = messages.map(message => `
            <div class="message-card">
              <div class="message-header">
                <span class="message-title">${this.escapeHtml(message.title || 'Message')}</span>
                <span class="message-time">${this.formatDateTime(message.created_at)}</span>
              </div>
              <div class="message-content">${this.escapeHtml(message.content)}</div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize view manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.viewManager = new ViewManager();
});