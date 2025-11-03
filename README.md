# FediTS - Fediverse Trust & Safety

A single-page application that compiles trust, moderation, and infrastructure transparency details for any Fediverse instance.

## 🌐 Live Demo

**[Try FediTS on GitHub Pages](https://crazypedia.github.io/FediTS/)**

Enter any Fediverse domain (e.g., `mastodon.social`, `fosstodon.org`) to see its trust and safety report.

## Features

- **Multi-Source Data Aggregation**: Queries FediDB, Fediverse Observer, and instance APIs
- **Multi-Platform Support**: Works with Mastodon, Pleroma, Misskey, Sharkey, Firefish, and more
- **Infrastructure Detection**: Identifies CDN, hosting provider, country, and cloud platforms
- **Trust & Safety Scoring**: Automated scoring based on transparency, moderation policies, and federation status
- **Blocklist Checking**: Compares instances against known blocklists (GardenFence, IFTAS DNI)
- **Server Covenant Verification**: Checks if instance is part of the Fediverse Server Covenant
- **Moderation Policy Display**: Shows published rules and moderation guidelines
- **Federation Analysis**: Displays peer connections and blocked instances
- **Smart Caching**: 8-hour cache for faster subsequent scans with manual rescan option
- **URL-Based Scanning**: Direct links to scan specific domains (e.g., `#mastodon.social`)
- **Export Reports**: Download results as JSON for further analysis

## Data Sources

- **FediDB**: Instance metadata and federation data
- **Instance APIs**: Direct queries to Mastodon-compatible APIs
- **Server Covenant List**: Community-maintained list of committed servers
- **GardenFence**: Moderation blocklist
- **IFTAS DNI (Do Not Interact)**: Industry-maintained blocklist

## Installation

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Basic Scan

1. Enter a Fediverse instance domain (e.g., `mastodon.social`)
2. Click "Analyze" to generate a comprehensive report
3. View results across different tabs:
   - **Overview**: Instance information and Server Covenant status
   - **Technical**: Software detection, infrastructure, hosting provider, CDN, country
   - **Moderation**: Published rules and blocked instances
   - **Federation**: Connected peers and federation status
   - **Trust**: Blocklist status and trust indicators
4. Export report as JSON for archival or further analysis

### URL-Based Scanning

You can link directly to a specific instance scan by adding the domain to the URL path:

```
https://crazypedia.github.io/FediTS/mastodon.social
https://crazypedia.github.io/FediTS/fosstodon.org
https://crazypedia.github.io/FediTS/misskey.io
```

This allows you to share direct links to instance reports or bookmark frequently-checked instances. The URLs use clean path-based routing (no `#` hash symbols).

### Caching & Rescanning

- **First scan**: Full data collection from all sources
- **Subsequent scans**: Cached results are served instantly (valid for 8 hours)
- **Cache indicator**: Blue banner shows when report is from cache and its age
- **Manual rescan**: Click "🔄 Rescan" button to force a fresh scan, bypassing cache
- **Automatic cleanup**: Expired caches (>8 hours) are automatically removed

Benefits:
- Faster load times for repeated scans
- Reduced API calls to external services
- Respectful of API rate limits
- Fresh data when you need it via manual rescan

## Project Structure

```
FediTS/
├── src/
│   ├── components/     # React components
│   │   ├── DomainInput.tsx
│   │   ├── ScoreDisplay.tsx
│   │   ├── ReportTabs.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorDisplay.tsx
│   ├── services/       # API services
│   │   ├── fedidb.ts
│   │   ├── instance.ts
│   │   ├── covenant.ts
│   │   ├── blocklists.ts
│   │   ├── infrastructure.ts
│   │   ├── cache.ts
│   │   └── reportGenerator.ts
│   ├── utils/          # Utility functions
│   │   └── domainUtils.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── styles/         # CSS styles
│   │   └── index.css
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Scoring Algorithm

The safety score (0-100) is calculated from four components:

1. **Uptime/Responsiveness (25 points)**: Instance API reachability
2. **Moderation Transparency (25 points)**: Published moderation policies
3. **Federation Visibility (25 points)**: Public peer list availability
4. **Trust (25 points)**: Blocklist status and Server Covenant membership

Bonuses:
- +5 points for Server Covenant membership

Penalties:
- Critical blocklist: -25 trust points
- Warning blocklist: -15 trust points
- API errors: -2 points each (max -10)

## Development Roadmap

### Phase 1 (MVP) - ✅ Complete
- Domain validation and normalization
- API integrations (FediDB, instance APIs, Covenant, blocklists)
- Multi-platform support (Mastodon, Pleroma, Misskey, Sharkey, Firefish, etc.)
- Infrastructure detection (CDN, hosting provider, country, ASN)
- Basic scoring algorithm
- React UI with tabs
- JSON export
- 8-hour caching with manual rescan
- URL-based routing for direct instance links

### Phase 2 (Planned)
- TLS certificate inspection and validation
- Historical trend tracking
- PDF export option
- User-supplied API keys for authenticated access
- Offline support with service workers

### Phase 3 (Future)
- Backend proxy for TLS inspection
- Rate limiting and quota management
- Advanced analytics and visualizations
- Federation network graphs
- Comparative analysis (multiple instances)

## Configuration

### Optional API Keys (Stub for Future)

For enhanced access to private or rate-limited data, API keys can be configured:

```typescript
// Future configuration structure
{
  user_tokens: {
    fedidb_key?: string,
    observer_key?: string,
    instance_admin_token?: string
  },
  privacy_mode: "private" | "anonymous"
}
```

*Note: This feature is not yet implemented but the architecture supports it.*

## Deployment

### GitHub Pages (Recommended - Automated)

This project is configured for automatic deployment to GitHub Pages:

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Build and deployment", select **Source: GitHub Actions**

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. The GitHub Actions workflow will automatically:
   - Build the project
   - Deploy to GitHub Pages
   - Your site will be available at: `https://[username].github.io/FediTS/`

The workflow runs automatically on every push to `main`, or you can trigger it manually from the Actions tab.

### Other Static Hosting Options

The application is a static SPA and can also be deployed to:

- **Netlify**: `npm run build` then deploy `dist/` folder
- **Vercel**: Connect GitHub repo and deploy automatically
- **Cloudflare Pages**: Connect repo and deploy
- **Traditional cPanel/Shared Hosting**: Upload `dist/` folder contents

### Manual Build & Deploy

```bash
# Build for production
npm run build

# The dist/ folder contains the complete static site
# Upload to any web server or static hosting service
```

**Note**: For non-GitHub-Pages deployments, you may need to adjust the `base` path in `vite.config.ts` from `/FediTS/` to `/` or your custom path.

## Privacy & Ethics

- No user data is collected or stored server-side
- All data comes from public APIs and community-maintained lists
- Reports are generated client-side in the browser
- External API calls are made directly from the user's browser
- Caching is handled locally in browser localStorage (8-hour retention)
- Cache data can be cleared manually or expires automatically
- No analytics, tracking, or telemetry of any kind

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- FediDB for instance metadata
- Fediverse Observer for uptime tracking
- Server Covenant maintainers
- GardenFence and IFTAS for blocklist curation
- The Fediverse community
