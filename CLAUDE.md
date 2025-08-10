# Family Pane Project

## Project Overview
A single "pane" display for families to hang in their hallway, kitchen, or elsewhere on a large vertical touch-screen display. Runs on Raspberry Pi with high performance optimization for low-powered machines. Integrates with Google Calendar and Google Photos, plus local features like chore tracking.

## Tech Stack & Architecture
- **Runtime**: Node.js (>=18.0.0) with native SQLite support
- **Backend**: Express.js with Socket.IO for real-time updates
- **Frontend**: Lightweight Material Design 3 CSS framework (`material-design-light`)
- **Display**: Browser-based kiosk mode using Chromium or WPE WebKit
- **Database**: SQLite for local data storage
- **Authentication**: OAuth 2.0 for Google services

## Key Features
1. **Google Calendar Integration**: Family event display with real-time updates
2. **Google Photos Integration**: Rotating family photo slideshow from selected albums
3. **Local Chores Tracking**: Family member task management and progress visualization
4. **Split-View Layouts**: Multiple view combinations (photos + calendar, etc.)
5. **Mobile Configuration**: Network-accessible admin interface for setup and management
6. **Touch-Optimized UI**: Portrait-first design with gesture support
7. **Offline Functionality**: Core features work without internet connection

## UI Design & Layout System

### Material Design 3 Implementation
- Framework: `material-design-light` (lightweight MD3 CSS at ~3KB)
- Touch Support: Native gesture support for vertical touchscreen displays
- Theme: Material You adaptive theming with family-friendly color schemes

### Split-View Layout Options
- 50/50 Photos + Calendar view
- 70/30 Primary content + sidebar
- Full-screen slideshow mode
- Configuration interface overlay

### Multiple Interface Views
1. **Family Display Views (Main Screen)**:
   - Home Dashboard: Weather, calendar highlights, family photos rotation
   - Split Calendar+Photos: Live calendar events with slideshow background
   - Chores Board: Family member task tracking with progress visualization
   - Photo Frame: Full-screen rotating family photos
   - Message Center: Family announcements and reminders

2. **Mobile Configuration Interface**:
   - Network Discovery: Auto-discovery using `local-devices`
   - Layout configuration (choose split-view combinations)
   - Google account management (OAuth setup/refresh)
   - Photo album selection and rotation settings
   - Family member management and chore assignment
   - Display settings (brightness, sleep schedule)
   - Real-time preview of changes on main display

## External Integrations

### Google Calendar Integration
- OAuth 2.0 with secure refresh token management
- Webhook support for real-time event updates
- Multiple Google accounts aggregation for family calendars
- Clean card-based event display with Material Design

### Google Photos Integration  
- 2025 API compliance (works within new API limitations)
- Album slideshow with selected family albums
- Smart display with time-based rotation and fade transitions
- Offline photo caching for uninterrupted display

### Local Features
- SQLite-based family task management
- Individual member dashboards and statistics
- Offline mode for core functionality
- Background sync when connectivity restored

## Project Structure
```
pane/
├── server/
│   ├── app.js (Express + Socket.IO main server)
│   ├── routes/
│   │   ├── api/ (REST endpoints)
│   │   ├── auth/ (OAuth handlers)
│   │   └── config/ (mobile config interface)
│   ├── services/
│   │   ├── google-calendar.js (Calendar API integration)
│   │   ├── google-photos.js (Photos API integration)
│   │   └── database.js (SQLite operations)
│   └── middleware/ (Auth, rate limiting, etc.)
├── client/
│   ├── display/ (main family display interface)
│   │   ├── index.html
│   │   ├── css/ (Material Design 3 + custom styles)
│   │   └── js/ (view management, touch handlers)
│   └── config/ (mobile configuration interface)
│       ├── admin.html
│       └── mobile-optimized assets
├── config/ (OAuth credentials, display settings)
├── package.json
└── CLAUDE.md (this file)
```

## Implementation Phases
1. ✅ **Phase 1**: Core Setup - Express server, SQLite database, basic Material Design UI
2. ✅ **Phase 1.5**: Testing Infrastructure - Jest test suite, GitHub Actions CI/CD, coverage reporting
3. **Phase 2**: Google Integrations - OAuth 2.0, Calendar API, Photos API with real-time updates
4. **Phase 3**: Mobile Configuration - Network discovery, responsive admin interface, real-time preview
5. **Phase 4**: Advanced Features - Split-view system, touch gestures, offline functionality
6. **Phase 5**: Performance - Raspberry Pi optimization, caching, resource management
7. **Phase 6**: Polish - Animations, themes, error handling, deployment automation

## Key Dependencies

### Production Dependencies
- **express**: Web server framework
- **socket.io**: Real-time bidirectional communication
- **sqlite3**: Lightweight database for local storage
- **googleapis**: Google APIs client library
- **dotenv**: Environment variable management
- **local-devices**: Network device discovery
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **morgan**: HTTP request logger

### Development Dependencies
- **jest**: Testing framework
- **supertest**: HTTP integration testing
- **nodemon**: Development server with auto-reload
- **@types/jest**: TypeScript definitions for Jest

## Google API Setup Requirements
1. Create Google Cloud Console project
2. Enable Google Calendar API and Google Photos Library API
3. Set up OAuth 2.0 credentials for web application
4. Configure authorized redirect URIs
5. Download credentials.json file

## Raspberry Pi Deployment Considerations
- Optimize for ARM architecture
- Configure for kiosk mode display
- Set up auto-start on boot
- Configure touch screen calibration
- Manage power saving and sleep modes

## Testing Infrastructure

### Test Suite Overview
- **36 comprehensive tests** covering all core functionality
- **79.5% code coverage** with targets of 70%+ across all metrics
- **Jest framework** with Supertest for API testing
- **In-memory SQLite** database for isolated, fast testing
- **GitHub Actions CI/CD** with automated testing on every commit

### Test Categories
- **Unit Tests**: Database operations, validation, configuration management
- **Integration Tests**: API endpoints, HTTP responses, security headers, error handling
- **Coverage Reports**: HTML, LCOV, and text formats with detailed branch analysis

### CI/CD Pipeline Features
- **Automated Testing**: Runs on push/PR to main and develop branches
- **Multi-Environment**: Testing across Node.js versions and operating systems
- **Performance Monitoring**: Response time and memory usage checks
- **Raspberry Pi Compatibility**: ARM architecture validation
- **Security Audits**: Automated dependency vulnerability scanning
- **Coverage Reporting**: Integration with Codecov for coverage tracking

## Security Considerations
- OAuth tokens stored securely
- Rate limiting on API endpoints
- HTTPS for production deployment
- Input validation and sanitization
- Network access controls

## Development Commands
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run complete test suite (36 tests, 79.5% coverage)
- `npm run test:watch`: Run tests in watch mode for development
- `npm run test:coverage`: Generate detailed coverage report
- `npm run test:ci`: CI-optimized testing (used by GitHub Actions)

## Current Status
**Phase 1: COMPLETED** ✅
- ✅ Basic Node.js project structure and dependencies
- ✅ Express server with Socket.IO for real-time updates
- ✅ SQLite database with family members and chores tables
- ✅ Complete Material Design 3 UI with touch gesture support
- ✅ Responsive layout system with multiple view modes
- ✅ Comprehensive documentation and setup scripts
- ✅ **NEW**: Complete Jest test suite with 79.5% coverage
- ✅ **NEW**: GitHub Actions CI/CD pipeline with multi-environment testing
- ✅ **NEW**: API integration tests and database unit tests
- ✅ **NEW**: Automated testing, coverage reporting, and deployment workflows

**Phase 2: READY TO START** 🚀
- 🔄 Google OAuth 2.0 authentication flow
- 🔄 Google Calendar API integration
- 🔄 Google Photos API integration  
- 🔄 Mobile configuration interface

## Quick Start for Development

```bash
# Ensure correct Node.js version
nvm use 18.19.0

# Install dependencies and verify setup
npm run setup:install

# Start development server
npm run dev

# Open http://localhost:8080 to see the family pane
```

## Available NPM Scripts
- `npm start` - Production server
- `npm run dev` - Development server with auto-reload
- `npm test` - Run complete test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - CI-optimized test run (no watch, with coverage)
- `npm run setup:verify` - Verify installation and configuration
- `npm run setup:install` - Complete installation with verification
- `npm run setup:env` - Copy environment template