// Touch and Gesture Handling for Family Pane
class TouchHandler {
  constructor() {
    this.gestures = {
      swipeThreshold: 100,
      swipeVelocity: 0.3,
      longPressDelay: 500,
      doubleTapDelay: 300
    };
    
    this.touchData = {
      startX: 0,
      startY: 0,
      startTime: 0,
      lastTap: 0,
      longPressTimer: null,
      isLongPress: false,
      isDragging: false
    };

    this.init();
  }

  init() {
    // Add touch event listeners
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Add mouse event listeners for desktop testing
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // Prevent default touch behaviors
    document.addEventListener('touchstart', this.preventDefaults.bind(this));
    document.addEventListener('touchmove', this.preventDefaults.bind(this));

    // Add CSS for touch feedback
    this.addTouchStyles();
  }

  addTouchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Touch feedback styles */
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }

      .touch-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        pointer-events: none;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
      }

      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      .touch-highlight {
        background: var(--md-sys-color-primary-container) !important;
        color: var(--md-sys-color-on-primary-container) !important;
        transition: all 0.15s ease;
      }

      .offline {
        opacity: 0.7;
      }

      .offline::before {
        content: "OFFLINE";
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--md-sys-color-error);
        color: var(--md-sys-color-on-error);
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 500;
        z-index: 9999;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Swipe indicators */
      .swipe-indicator {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        background: var(--md-sys-color-surface);
        color: var(--md-sys-color-on-surface);
        padding: 16px;
        border-radius: 50%;
        box-shadow: var(--md-sys-elevation-3);
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
      }

      .swipe-indicator.left {
        left: 24px;
      }

      .swipe-indicator.right {
        right: 24px;
      }

      .swipe-indicator.show {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  handleTouchStart(event) {
    const touch = event.touches[0];
    this.startTouch(touch.clientX, touch.clientY);
    
    // Add touch feedback
    this.addTouchFeedback(event.target, touch.clientX, touch.clientY);
  }

  handleTouchMove(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.moveTouch(touch.clientX, touch.clientY);
    }
  }

  handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    this.endTouch(touch.clientX, touch.clientY);
  }

  handleMouseDown(event) {
    this.startTouch(event.clientX, event.clientY);
    this.addTouchFeedback(event.target, event.clientX, event.clientY);
  }

  handleMouseMove(event) {
    if (event.buttons === 1) { // Left mouse button is down
      this.moveTouch(event.clientX, event.clientY);
    }
  }

  handleMouseUp(event) {
    this.endTouch(event.clientX, event.clientY);
  }

  startTouch(x, y) {
    this.touchData.startX = x;
    this.touchData.startY = y;
    this.touchData.startTime = Date.now();
    this.touchData.isDragging = false;
    this.touchData.isLongPress = false;

    // Clear any existing long press timer
    if (this.touchData.longPressTimer) {
      clearTimeout(this.touchData.longPressTimer);
    }

    // Start long press timer
    this.touchData.longPressTimer = setTimeout(() => {
      this.touchData.isLongPress = true;
      this.handleLongPress(x, y);
    }, this.gestures.longPressDelay);
  }

  moveTouch(x, y) {
    if (!this.touchData.startTime) return;

    const deltaX = x - this.touchData.startX;
    const deltaY = y - this.touchData.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel long press if finger moves too much
    if (distance > 10 && this.touchData.longPressTimer) {
      clearTimeout(this.touchData.longPressTimer);
      this.touchData.longPressTimer = null;
    }

    // Detect dragging
    if (distance > 20) {
      this.touchData.isDragging = true;
      this.handleDrag(deltaX, deltaY);
    }
  }

  endTouch(x, y) {
    if (!this.touchData.startTime) return;

    const deltaX = x - this.touchData.startX;
    const deltaY = y - this.touchData.startY;
    const deltaTime = Date.now() - this.touchData.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clear long press timer
    if (this.touchData.longPressTimer) {
      clearTimeout(this.touchData.longPressTimer);
      this.touchData.longPressTimer = null;
    }

    // Don't process if it was a long press or drag
    if (this.touchData.isLongPress || this.touchData.isDragging) {
      this.resetTouchData();
      return;
    }

    // Detect swipe gestures
    if (distance > this.gestures.swipeThreshold && deltaTime < 1000) {
      const velocity = distance / deltaTime;
      
      if (velocity > this.gestures.swipeVelocity) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.handleSwipe('right');
          } else {
            this.handleSwipe('left');
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            this.handleSwipe('down');
          } else {
            this.handleSwipe('up');
          }
        }
        
        this.resetTouchData();
        return;
      }
    }

    // Detect tap gestures
    if (distance < 20 && deltaTime < 500) {
      const currentTime = Date.now();
      
      // Check for double tap
      if (currentTime - this.touchData.lastTap < this.gestures.doubleTapDelay) {
        this.handleDoubleTap(x, y);
      } else {
        // Single tap - let it bubble up normally
        setTimeout(() => {
          if (Date.now() - currentTime >= this.gestures.doubleTapDelay) {
            // No double tap occurred, process as single tap
            this.handleTap(x, y);
          }
        }, this.gestures.doubleTapDelay);
      }
      
      this.touchData.lastTap = currentTime;
    }

    this.resetTouchData();
  }

  resetTouchData() {
    this.touchData = {
      startX: 0,
      startY: 0,
      startTime: 0,
      lastTap: this.touchData.lastTap,
      longPressTimer: null,
      isLongPress: false,
      isDragging: false
    };
  }

  handleSwipe(direction) {
    console.log('Swipe detected:', direction);
    
    // Show swipe indicator
    this.showSwipeIndicator(direction);

    if (!window.familyPaneApp) return;

    // Handle view switching with swipes
    const currentView = window.familyPaneApp.currentView;
    const views = ['dashboard', 'calendar-photos', 'chores', 'photos', 'messages'];
    const currentIndex = views.indexOf(currentView);

    if (direction === 'left') {
      // Next view
      const nextIndex = (currentIndex + 1) % views.length;
      window.familyPaneApp.switchView(views[nextIndex]);
    } else if (direction === 'right') {
      // Previous view
      const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
      window.familyPaneApp.switchView(views[prevIndex]);
    } else if (direction === 'up') {
      // Could be used for showing settings or menu
      document.getElementById('view-switcher')?.click();
    } else if (direction === 'down') {
      // Could be used for refreshing data
      if (window.familyPaneApp.loadViewData) {
        window.familyPaneApp.loadViewData();
        window.familyPaneApp.showStatus('Refreshing...', 'info');
      }
    }
  }

  handleTap(x, y) {
    // Single tap handling is mostly handled by normal click events
    console.log('Tap detected at:', x, y);
  }

  handleDoubleTap(x, y) {
    console.log('Double tap detected at:', x, y);
    
    // Double tap to toggle fullscreen mode (if supported)
    if (document.fullscreenEnabled) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    }

    // Or double tap to go to photo view
    if (window.familyPaneApp) {
      window.familyPaneApp.switchView('photos');
    }
  }

  handleLongPress(x, y) {
    console.log('Long press detected at:', x, y);
    
    // Long press to open settings
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.click();
    }
    
    // Add haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  handleDrag(deltaX, deltaY) {
    // Drag handling - could be used for custom interactions
    console.log('Dragging:', deltaX, deltaY);
  }

  addTouchFeedback(element, x, y) {
    // Add touch feedback class to clickable elements
    const clickableElements = ['BUTTON', 'A', 'INPUT'];
    let target = element;
    
    // Find the closest clickable element
    while (target && target !== document.body) {
      if (clickableElements.includes(target.tagName) || 
          target.classList.contains('md-button') ||
          target.classList.contains('nav-button') ||
          target.classList.contains('chore-card') ||
          target.classList.contains('view-option')) {
        
        target.classList.add('touch-highlight');
        
        // Remove highlight after a short delay
        setTimeout(() => {
          target.classList.remove('touch-highlight');
        }, 150);
        
        // Add ripple effect
        this.createRipple(target, x, y);
        break;
      }
      target = target.parentElement;
    }
  }

  createRipple(element, x, y) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    
    ripple.classList.add('touch-ripple');
    ripple.style.left = (x - rect.left) + 'px';
    ripple.style.top = (y - rect.top) + 'px';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    
    // Ensure element has proper positioning for ripple
    if (!element.classList.contains('touch-feedback')) {
      element.classList.add('touch-feedback');
    }
    
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentElement) {
        ripple.parentElement.removeChild(ripple);
      }
    }, 600);
  }

  showSwipeIndicator(direction) {
    const indicator = document.createElement('div');
    indicator.classList.add('swipe-indicator', direction === 'left' ? 'right' : 'left');
    
    const icon = document.createElement('i');
    icon.classList.add('material-icons');
    
    switch (direction) {
      case 'left':
        icon.textContent = 'arrow_forward';
        break;
      case 'right':
        icon.textContent = 'arrow_back';
        break;
      case 'up':
        icon.textContent = 'arrow_upward';
        break;
      case 'down':
        icon.textContent = 'refresh';
        break;
    }
    
    indicator.appendChild(icon);
    document.body.appendChild(indicator);
    
    // Show indicator
    setTimeout(() => {
      indicator.classList.add('show');
    }, 10);
    
    // Hide and remove indicator
    setTimeout(() => {
      indicator.classList.remove('show');
      setTimeout(() => {
        if (indicator.parentElement) {
          indicator.parentElement.removeChild(indicator);
        }
      }, 300);
    }, 1000);
  }

  preventDefaults(event) {
    // Prevent default touch behaviors to avoid conflicts
    if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
      // Allow scrolling on scrollable containers
      let element = event.target;
      while (element) {
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
          return; // Allow default behavior for scrollable elements
        }
        element = element.parentElement;
      }
      
      // Prevent default for non-scrollable elements
      event.preventDefault();
    }
  }
}

// Initialize touch handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.touchHandler = new TouchHandler();
});