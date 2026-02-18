# Chrome Web Store Submission Guide

## Extension Icons

The extension includes three icon sizes:

- **16x16**: `/extension/icons/icon-16.svg` - Toolbar icon
- **48x48**: `/extension/icons/icon-48.svg` - Extension management page
- **128x128**: `/extension/icons/icon-128.svg` - Chrome Web Store listing

All icons feature the A2UI branding with a blue theme (#007bff).

## Screenshots for Chrome Web Store

### Required Screenshots

Chrome Web Store requires 1-5 screenshots at **1280x800** or **640x400** resolution.

### Recommended Screenshots

1. **Message Inspector View** (1280x800)
   - Show the Messages tab active
   - Display several captured A2UI messages
   - Highlight the search and filter functionality
   - Show message details panel

2. **Network Inspector View** (1280x800)
   - Show the Network tab active
   - Display connection status (connected)
   - Show bandwidth chart with data
   - Display message queue with queued items
   - Show health score indicator

3. **Action Tracer View** (1280x800)
   - Show the Actions tab active
   - Display traced user actions
   - Show action timeline and details

4. **State Tree Viewer** (1280x800)
   - Show the State Tree tab active
   - Display hierarchical state structure
   - Show state diffing capabilities

5. **Performance Profiler** (1280x800)
   - Show the Performance tab active
   - Display performance metrics charts
   - Show memory usage and latency graphs

### How to Create Screenshots

1. **Build the extension**:
   ```bash
   npm run build
   npm run package
   ```

2. **Load unpacked extension in Chrome**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` directory

3. **Open Chrome DevTools**:
   - Open a test page with A2UI
   - Press F12 to open DevTools
   - Click "A2UI Inspector" tab

4. **Capture screenshots**:
   - Use macOS: `Cmd+Shift+4` → `Space` → Click window
   - Use Windows: `Win+Shift+S`
   - Or use Chrome DevTools screenshot tool

5. **Resize screenshots**:
   ```bash
   # Use ImageMagick or similar tool
   convert screenshot.png -resize 1280x800 screenshot-web-store.png
   ```

## Chrome Web Store Listing Details

### Name
**A2UI Inspector**

### Short Description (132 characters max)
Developer tools for debugging and inspecting A2UI protocol messages, actions, state, performance, and network connections.

### Detailed Description
A comprehensive Chrome DevTools extension for debugging applications using the AINative A2UI protocol.

**Features:**
- 📨 Message Inspector - Capture, filter, and analyze A2UI protocol messages
- 🌐 Network Inspector - Monitor WebSocket connections, bandwidth, and message queues
- ⚡ Action Tracer - Track user actions and their lifecycle
- 🌲 State Tree Viewer - Visualize and inspect application state
- 📊 Performance Profiler - Analyze latency, memory usage, and rendering performance

**Perfect for:**
- A2UI application developers
- Frontend engineers working with AI-native interfaces
- QA engineers testing A2UI applications
- Performance optimization

**Key Capabilities:**
✅ Real-time message capture and inspection
✅ WebSocket connection health monitoring
✅ Bandwidth usage tracking with visualizations
✅ Message queue status and retry tracking
✅ Export captured data for offline analysis
✅ Filter and search across all captured data
✅ Keyboard accessible interface
✅ Dark mode support

Open source and actively maintained by the AINative team.

### Category
**Developer Tools**

### Language
**English**

### Privacy Policy
Since the extension doesn't collect user data, you can use:
"This extension does not collect, store, or transmit any personal data. All inspection data remains local to your browser."

### Permissions Justification

- **devtools**: Required to integrate with Chrome DevTools
- **storage**: Used to persist user preferences (optional)
- **activeTab**: Required to inject content scripts into the active page

## Publishing Checklist

- [ ] Icons created (16x16, 48x48, 128x128)
- [ ] 3-5 screenshots captured at 1280x800
- [ ] Manifest.json version updated
- [ ] Extension tested in Chrome
- [ ] All features working correctly
- [ ] Privacy policy added
- [ ] Detailed description written
- [ ] Category selected (Developer Tools)
- [ ] Built and packaged extension (.zip)
- [ ] Developer account verified ($5 one-time fee)

## Submission Process

1. Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload the packaged extension (.zip)
4. Fill in all required fields
5. Upload screenshots and icons
6. Submit for review
7. Wait 1-3 days for approval

## Post-Publication

- Monitor reviews and ratings
- Respond to user feedback
- Update extension regularly
- Announce on social media
- Add to documentation sites

---

**Note**: This extension is part of the AINative ecosystem. For more information, visit [ainative.studio](https://ainative.studio).
