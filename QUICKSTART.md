# Quick Start Guide

Get your Family Pane running in 5 minutes!

## Prerequisites

- **nvm** (Node Version Manager) installed
- **Git** installed

## Quick Setup

### 1. Install Node.js with nvm

```bash
# Install the correct Node.js version
nvm install 18.19.0
nvm use 18.19.0

# Verify installation
node --version  # Should show v18.19.0
```

### 2. Install Dependencies

```bash
# Install all dependencies and verify setup
npm run setup:install
```

### 3. Configure Environment

```bash
# Copy environment template
npm run setup:env

# Edit the .env file with your settings
# At minimum, set NODE_ENV=development for local testing
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev
```

### 5. Open the Application

- **Main Display**: http://localhost:8080
- **Admin Interface**: http://localhost:8080/admin

## What Works Right Now

✅ **Basic UI Structure**: Complete Material Design 3 interface  
✅ **View Switching**: Dashboard, Calendar+Photos, Chores, Photos, Messages  
✅ **Touch Gestures**: Swipe between views, tap interactions  
✅ **Database**: SQLite setup with family members and chores tables  
✅ **Real-time Updates**: Socket.IO for live synchronization  

## What's Coming Next

🚧 **Google Integration**: Calendar and Photos APIs  
🚧 **Mobile Admin**: Network configuration interface  
🚧 **Offline Mode**: Cached data and sync  

## Need Help?

Run the setup verification:
```bash
npm run setup:verify
```

Check the full [README.md](README.md) for detailed setup instructions.