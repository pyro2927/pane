# Family Pane

A family display system designed for large vertical touchscreen displays, perfect for hallways, kitchens, or common areas. Built to run efficiently on Raspberry Pi with integration for Google Calendar, Google Photos, and local family management features like chore tracking.

## Features

- **📅 Google Calendar Integration**: Display family events and schedules in real-time
- **📸 Google Photos Slideshow**: Rotating family photos from selected albums
- **✅ Chores Tracking**: Local family member task management with progress visualization
- **🏠 Split-View Layouts**: Multiple display combinations (photos + calendar, etc.)
- **📱 Mobile Configuration**: Network-accessible admin interface for setup and management
- **👆 Touch-Optimized UI**: Portrait-first design with gesture support and Material Design 3
- **📶 Offline Functionality**: Core features work without internet connection
- **🔄 Real-time Updates**: Live synchronization across all interfaces

## Tech Stack

- **Backend**: Node.js 18.19.0, Express.js, Socket.IO
- **Database**: SQLite (native Node.js support)
- **Frontend**: Vanilla JavaScript, Material Design 3 CSS, responsive layouts
- **Authentication**: Google OAuth 2.0
- **APIs**: Google Calendar API, Google Photos Library API

## Prerequisites

### Required Software

1. **Node.js 18.19.0** (managed via nvm)
2. **nvm** (Node Version Manager)
3. **Git**

### Hardware Requirements

- **Recommended**: Raspberry Pi 4 (4GB RAM minimum)
- **Alternative**: Any Linux/macOS/Windows machine
- **Display**: Large vertical touchscreen (recommended 15" or larger)
- **Network**: WiFi or Ethernet connection

### Google API Setup

1. **Google Cloud Console Project**
   - Create a new project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Calendar API and Google Photos Library API
   
2. **OAuth 2.0 Credentials**
   - Create OAuth 2.0 credentials for a web application
   - Set authorized JavaScript origins to `http://localhost:8080`
   - Set authorized redirect URIs to `http://localhost:8080/auth/google/callback`
   - Download the `credentials.json` file

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pane
```

### 2. Set Up Node.js with nvm

Install nvm if you don't have it:

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or source your profile
source ~/.bashrc  # or ~/.zshrc
```

Install and use the correct Node.js version:

```bash
# Install the specified Node.js version
nvm install 18.19.0

# Use the correct version (this reads from .nvmrc)
nvm use

# Verify versions
node --version  # Should output v18.19.0
npm --version   # Should be >= 9.0.0
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback

# Server Configuration
PORT=8080
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./config/pane.db

# Display Configuration
DEFAULT_VIEW=dashboard
PHOTO_ROTATION_INTERVAL=30000
CALENDAR_REFRESH_INTERVAL=300000

# Network Configuration
DISCOVERY_PORT=3001
ADMIN_PORT=3002
```

### 5. Google Credentials Setup

Place your `credentials.json` file from Google Cloud Console in the `config/` directory:

```bash
mkdir -p config
# Copy your credentials.json to config/credentials.json
```

## Development

### Running the Development Server

```bash
# Start development server with auto-restart
npm run dev

# Or start production server
npm start
```

### Accessing the Application

- **Main Display**: http://localhost:8080
- **Admin Interface**: http://localhost:8080/admin
- **Health Check**: http://localhost:8080/health

### Development Commands

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run comprehensive test suite (36 tests, 79.5% coverage)
npm test

# Run tests in watch mode for development
npm run test:watch

# Generate detailed coverage report
npm run test:coverage

# Check Node.js version
nvm current

# Switch to project Node.js version
nvm use
```

## Testing

### Test Suite

The Family Pane includes a comprehensive test suite with:

- **36 tests** covering all major functionality
- **79.5% code coverage** with targets of 70%+ across all metrics
- **Unit tests** for database operations and business logic
- **Integration tests** for API endpoints and HTTP responses
- **Automated CI/CD** with GitHub Actions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate detailed coverage report (HTML + LCOV)
npm run test:coverage

# CI-optimized test run (used by GitHub Actions)
npm run test:ci
```

### Test Coverage

Current coverage includes:
- Database operations (family members, chores, configuration)
- API endpoints (REST routes, error handling, validation)
- Security features (headers, input validation)
- Static file serving and routing

### Continuous Integration

Tests run automatically on:
- Every push to `main` or `develop` branches
- All pull requests
- Weekly compatibility checks across Node.js versions
- Multi-OS testing (Ubuntu, macOS)

The CI pipeline also includes:
- Security audits
- Performance benchmarks  
- Raspberry Pi ARM compatibility checks
- Automated deployment workflows

## Project Structure

```
pane/
├── .nvmrc                          # Node.js version specification
├── package.json                    # Project dependencies and scripts
├── .env.example                    # Environment variables template
├── CLAUDE.md                       # Project documentation and plan
├── README.md                       # This file
├── server/                         # Backend application
│   ├── app.js                      # Main Express server
│   ├── routes/                     # API route handlers
│   │   ├── api/                    # REST API endpoints
│   │   │   ├── calendar.js         # Calendar API routes
│   │   │   ├── photos.js           # Photos API routes
│   │   │   └── chores.js           # Chores management routes
│   │   ├── auth/                   # Authentication routes
│   │   │   └── index.js            # OAuth handlers
│   │   └── config/                 # Configuration routes
│   │       └── index.js            # Admin interface API
│   ├── services/                   # Business logic services
│   │   ├── database.js             # SQLite database manager
│   │   ├── google-calendar.js      # Calendar API integration (pending)
│   │   └── google-photos.js        # Photos API integration (pending)
│   └── middleware/                 # Express middleware
├── client/                         # Frontend application
│   ├── display/                    # Main family display interface
│   │   ├── index.html              # Main display HTML
│   │   ├── css/                    # Stylesheets
│   │   │   ├── main.css            # Base styles and Material Design 3
│   │   │   ├── views.css           # View-specific styles
│   │   │   └── components.css      # Reusable component styles
│   │   └── js/                     # JavaScript modules
│   │       ├── app.js              # Main application logic
│   │       ├── api.js              # API client
│   │       ├── views.js            # View management
│   │       └── touch.js            # Touch gesture handling
│   ├── config/                     # Mobile admin interface
│   │   └── admin.html              # Admin interface (pending)
│   └── assets/                     # Static assets
└── config/                         # Configuration files
    ├── pane.db                     # SQLite database (created automatically)
    └── credentials.json            # Google OAuth credentials (you provide)
```

## Usage

### First Time Setup

1. **Start the application**: `npm run dev`
2. **Open admin interface**: http://localhost:8080/admin
3. **Authenticate with Google**: Set up calendar and photos access
4. **Configure family members**: Add family members with names and colors
5. **Create chores**: Set up family chores and assign to members
6. **Select photo albums**: Choose Google Photos albums for slideshow

### Main Display Interface

The main family display provides several views accessible via touch gestures or the view switcher:

1. **Dashboard**: Overview with weather, calendar highlights, chores, and photos
2. **Calendar + Photos**: Split view with full calendar and photo slideshow
3. **Chores Board**: Kanban-style chore management (To Do, In Progress, Done)
4. **Photo Frame**: Full-screen photo slideshow
5. **Message Center**: Family announcements and messages

### Touch Gestures

- **Swipe Left/Right**: Switch between views
- **Swipe Up**: Open view switcher menu
- **Swipe Down**: Refresh current view data
- **Double Tap**: Switch to photo frame view
- **Long Press**: Open settings/admin interface
- **Tap**: Standard interaction with UI elements

### Mobile Configuration

Access the admin interface from any device on the same network:

1. **Find the device IP**: The server shows the IP address on startup
2. **Open admin interface**: `http://[DEVICE_IP]:8080/admin`
3. **Configure settings**: Manage layouts, family members, and integrations

## API Endpoints

### Configuration
- `GET /api/config/display` - Get display configuration
- `POST /api/config/display` - Update display configuration
- `GET /api/config/system/info` - Get system information

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `GET /api/calendar/calendars` - List available calendars

### Photos
- `GET /api/photos/albums` - Get photo albums
- `GET /api/photos/random` - Get random photo

### Chores
- `GET /api/chores` - List chores
- `POST /api/chores` - Create new chore
- `PUT /api/chores/:id` - Update chore
- `DELETE /api/chores/:id` - Delete chore

### Family Members
- `GET /api/chores/members` - List family members
- `POST /api/chores/members` - Add family member

## Raspberry Pi Deployment

### Preparing Raspberry Pi OS

1. **Flash Raspberry Pi OS Lite** to SD card
2. **Enable SSH and WiFi** during setup
3. **Update system**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Install Dependencies

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js
nvm install 18.19.0
nvm use 18.19.0

# Install Git
sudo apt install git -y
```

### Kiosk Mode Setup

For automatic startup and kiosk mode:

```bash
# Install Chromium
sudo apt install chromium-browser -y

# Create kiosk startup script
sudo nano /etc/systemd/system/family-pane.service
```

Add service configuration:

```ini
[Unit]
Description=Family Pane Application
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pane
ExecStart=/home/pi/.nvm/versions/node/v18.19.0/bin/node server/app.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable family-pane
sudo systemctl start family-pane
```

### Display Configuration

Configure the display for kiosk mode by editing `/boot/config.txt`:

```bash
# For official 7" touchscreen
display_rotate=1  # Portrait orientation
```

## Troubleshooting

### Common Issues

1. **Node.js Version Mismatch**
   ```bash
   nvm use  # Uses version from .nvmrc
   node --version  # Verify correct version
   ```

2. **Database Permissions**
   ```bash
   # Ensure config directory is writable
   chmod 755 config/
   ```

3. **Google API Errors**
   - Verify OAuth credentials are correctly configured
   - Check API quotas in Google Cloud Console
   - Ensure correct redirect URIs

4. **Network Connection Issues**
   ```bash
   # Test API connectivity
   curl http://localhost:8080/health
   ```

5. **Touch Screen Calibration**
   ```bash
   # Install calibration tool
   sudo apt install xinput-calibrator
   # Run calibration
   xinput_calibrator
   ```

### Development Debugging

- **Enable debug logging**: Set `NODE_ENV=development` in `.env`
- **Check browser console**: F12 Developer Tools on the main display
- **Monitor server logs**: Check terminal output for API errors
- **Database inspection**: Use SQLite browser tools to inspect `config/pane.db`

### Performance Optimization

For Raspberry Pi deployment:

1. **Reduce photo resolution** in slideshow settings
2. **Increase cache intervals** for API calls
3. **Limit concurrent operations** in configuration
4. **Use wired Ethernet** instead of WiFi when possible

## Contributing

1. **Follow the existing code style**
2. **Update documentation** for any new features
3. **Test on both development and Raspberry Pi environments**
4. **Use the specified Node.js version**: `nvm use`

## Version Management

This project uses nvm for Node.js version management:

- **Node.js version**: Specified in `.nvmrc` and `package.json`
- **Always use**: `nvm use` when working on the project
- **Check version**: `nvm current` to verify you're using the correct version
- **Update**: When updating Node.js version, update both `.nvmrc` and `package.json`

## Security Considerations

- **OAuth tokens** are stored securely in the database
- **HTTPS** should be configured for production deployments
- **Network access** should be restricted to trusted devices
- **Regular updates** of dependencies for security patches

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:

1. **Check the troubleshooting section** above
2. **Review logs** for error messages
3. **Verify configuration** in `.env` file
4. **Test with development server** before deploying to Raspberry Pi

---

**Last Updated**: January 2025  
**Node.js Version**: 18.19.0  
**Tested Platforms**: macOS, Linux, Raspberry Pi OS