# FediTS - Fediverse Trust & Safety

A single-page application that compiles trust, moderation, and infrastructure transparency details for any Fediverse instance.

## Features

- **Multi-Source Data Aggregation**: Queries FediDB, Fediverse Observer, and instance APIs
- **Trust & Safety Scoring**: Automated scoring based on transparency, moderation policies, and federation status
- **Blocklist Checking**: Compares instances against known blocklists (GardenFence, IFTAS DNI)
- **Server Covenant Verification**: Checks if instance is part of the Fediverse Server Covenant
- **Moderation Policy Display**: Shows published rules and moderation guidelines
- **Federation Analysis**: Displays peer connections and blocked instances
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

1. Enter a Fediverse instance domain (e.g., `mastodon.social`)
2. Click "Analyze" to generate a comprehensive report
3. View results across different tabs:
   - **Overview**: Instance information and Server Covenant status
   - **Moderation**: Published rules and blocked instances
   - **Federation**: Connected peers and federation status
   - **Trust**: Blocklist status and trust indicators
4. Export report as JSON for archival or further analysis

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
- Basic scoring algorithm
- React UI with tabs
- JSON export

### Phase 2 (Planned)
- HTTP/TLS metadata checking (certificate, headers, security)
- Enhanced caching and offline support
- Historical trend tracking
- PDF export option
- User-supplied API keys for authenticated access

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

### Static Hosting (Recommended for MVP)

The application is a static SPA and can be deployed to:

- **Netlify**: `npm run build` then deploy `dist/` folder
- **Vercel**: Connect GitHub repo and deploy automatically
- **GitHub Pages**: Use `gh-pages` package
- **Cloudflare Pages**: Connect repo and deploy
- **Traditional cPanel/Shared Hosting**: Upload `dist/` folder contents

### Example deployment commands:

```bash
# Build for production
npm run build

# The dist/ folder contains the complete static site
# Upload to any web server or static hosting service
```

## Privacy & Ethics

- No user data is collected or stored server-side
- All data comes from public APIs and community-maintained lists
- Reports are generated client-side in the browser
- External API calls are made directly from the user's browser
- Caching is handled in-browser with localStorage/memory

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
