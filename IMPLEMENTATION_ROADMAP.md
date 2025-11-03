# FediTS Trust & Safety Scoring Enhancement - Implementation Roadmap

## Status Overview

- ✅ **Priority 1**: Enhanced Rule Language Scoring (COMPLETED)
- 🔄 **Priorities 2-7**: In Progress

## Task Dependencies & Execution Order

```
Priority 1: Enhanced Rule Scoring ✅
    ↓
Priority 2: Data Management Layer (NEXT)
    ↓
Priority 3: Enhanced Metadata Scoring
    ↓
Priority 4: Dynamic Network Health Scoring
    ↓
Priority 5: External API Integration
    ↓
Priority 6: Composite Scoring Framework
    ↓
Priority 7: UI/UX Enhancements
```

---

## Priority 2: Data Management Layer (Foundation)

**Why First**: Required for API caching, pre-computed data, and performance optimization across all other features.

### 2.1 LocalStorage Caching System
- [ ] Create cache manager (`src/utils/cacheManager.ts`)
  - TTL-based expiration (configurable per data type)
  - Namespace support (reports, API responses, metadata)
  - Size management (prevent quota exceeded errors)
  - Versioning (invalidate cache on schema changes)
- [ ] Cache strategies:
  - Instance reports: 7 days
  - External API responses: 24-48 hours
  - Known instance lists: 24 hours
  - NodeInfo data: 12 hours

### 2.2 Pre-Computed Data Schema
- [ ] Create JSON schema definitions (`src/schemas/`)
  - Instance reputation lists (trusted/problematic)
  - Federation statistics (percentile calculations)
  - Blocklist aggregations
  - External API results
- [ ] GitHub Actions workflow for pre-computation
  - Weekly batch analysis of known instances
  - Store results in `public/data/precomputed/`
  - Serve as static JSON files

### 2.3 Configuration Management
- [ ] API configuration system (`src/config/apiConfig.ts`)
  - Environment variable support
  - Per-API enable/disable flags
  - Rate limit tracking
  - Fallback handling
- [ ] User preferences storage
  - Privacy mode (skip external API checks)
  - Cache preferences
  - Display preferences

**Deliverables**:
- `src/utils/cacheManager.ts`
- `src/config/apiConfig.ts`
- `src/schemas/*.json`
- `.github/workflows/precompute-data.yml`

---

## Priority 3: Enhanced Metadata Scoring (0-25 points)

**Why Next**: Simpler than network health, uses existing data, no external dependencies.

### 3.1 Instance Maturity Scoring (0-8 points)
- [ ] Age calculation (from NodeInfo or FediDB)
  - <30 days: 0 points
  - 30-90 days: 2 points
  - 90-365 days: 4 points
  - 1-2 years: 6 points
  - 2+ years: 8 points
- [ ] Activity metrics
  - User growth patterns (stable vs sudden spike)
  - Post volume consistency
  - Active user ratio

### 3.2 Administrative Transparency (0-7 points)
- [ ] Contact information presence (+2)
- [ ] Privacy policy available (+2)
- [ ] Terms of service available (+1)
- [ ] Admin account visible (+1)
- [ ] Security contact/reporting (+1)

### 3.3 Registration Policy Analysis (0-5 points)
- [ ] Parse NodeInfo `openRegistrations` field
- [ ] Analyze approval requirements
- [ ] Check for anti-spam measures
- [ ] Scoring:
  - Closed registration with clear policy: 5 points
  - Approval required with explanation: 4 points
  - Open with clear anti-spam: 3 points
  - Open without safeguards: 1 point

### 3.4 Description Quality (0-5 points)
- [ ] Length check (>200 chars: +2)
- [ ] Language diversity (+1)
- [ ] Clear community focus (+1)
- [ ] Contact/admin info included (+1)

**Deliverables**:
- `src/utils/metadataScoring.ts`
- Updated `reportGenerator.ts`
- Test coverage for scoring logic

---

## Priority 4: Dynamic Network Health Scoring (0-25 points)

**Why Next**: Builds on data management layer, requires statistical analysis.

### 4.1 Federation Analysis (0-10 points)
- [ ] Peer count percentile calculation
  - Fetch peer counts from known instances (pre-computed)
  - Calculate percentiles (25th, 50th, 75th, 90th)
  - Score based on position:
    - >90th percentile: 10 points (well-connected)
    - 75-90th: 8 points
    - 50-75th: 6 points
    - 25-50th: 4 points
    - <25th: 2 points
    - No peers: 0 points

### 4.2 Known Instance Reputation (0-8 points)
- [ ] Create reputation lists (JSON files)
  - `trusted-instances.json` - verified safe instances
  - `problematic-instances.json` - known issues
  - `new-instances.json` - recently created (needs observation)
- [ ] Reputation scoring:
  - In trusted list: +8 points
  - Not in any list: 4 points (neutral)
  - In problematic list: 0 points
  - Flag if in problematic list

### 4.3 Block Activity Analysis (0-4 points)
- [ ] Calculate block ratio (blocks / total known instances)
  - Very low (<1%): 4 points
  - Low (1-5%): 3 points
  - Medium (5-15%): 2 points
  - High (15-30%): 1 point
  - Very high (>30%): 0 points
- [ ] Pattern detection:
  - Blocking mostly problematic instances: positive signal
  - Blocking many trusted instances: red flag

### 4.4 Block Reciprocity Detection (0-3 points)
- [ ] Check if instance blocks match community norms
- [ ] Detect if instance is widely blocked by others
  - Not blocked by known instances: 3 points
  - Blocked by <5 instances: 2 points
  - Blocked by 5-20 instances: 1 point
  - Widely blocked (>20): 0 points, add flag

**Deliverables**:
- `src/utils/networkHealthScoring.ts`
- `public/data/trusted-instances.json`
- `public/data/problematic-instances.json`
- Statistical calculation utilities

---

## Priority 5: External API Integration (0-15 points)

**Why Next**: Now that we have caching and scoring components, add external validation.

### 5.1 Priority APIs (Phase 1)
- [ ] **Google Safe Browsing API**
  - Integration: `src/services/externalAPIs/safeBrowsing.ts`
  - Cache: 24 hours
  - Impact: Any threat = -50 points
  - Error handling: timeout 10s, graceful failure
- [ ] **SSL Labs API**
  - Integration: `src/services/externalAPIs/sslLabs.ts`
  - Cache: 48 hours (SSL configs change slowly)
  - Scoring: A+/A = +10, B = +5, C/D = 0, F = -10
- [ ] **crt.sh (Certificate Transparency)**
  - Integration: `src/services/externalAPIs/certificateTransparency.ts`
  - Cache: 7 days
  - Check: valid cert history, rapid reissuance detection
  - Scoring: Valid cert = +5, suspicious pattern = -5

### 5.2 Secondary APIs (Phase 2)
- [ ] **VirusTotal API**
  - Multi-vendor consensus
  - 0 positives: +5, 1-2: 0, 3+: -30
- [ ] **URLhaus (Abuse.ch)**
  - No key required
  - Listed = -40 points
- [ ] **AbuseIPDB**
  - Check server IP reputation
  - High abuse score = -20

### 5.3 API Infrastructure
- [ ] Rate limiting system
  - Per-API rate trackers
  - Queue system for requests
  - Exponential backoff
- [ ] Parallel execution framework
  - `Promise.all()` with timeout
  - Individual API timeouts (10s each)
  - Overall timeout (30s for all external checks)
- [ ] Configuration system
  - `src/config/externalAPIs.json`
  - Environment variable support
  - Enable/disable per API
  - API key management

### 5.4 Privacy Controls
- [ ] User consent for external checks
  - Checkbox: "Enable external security checks"
  - Warning about domain disclosure
  - Default: OFF for privacy
- [ ] Pre-computation via GitHub Actions
  - Weekly checks of known instances
  - Store results in static JSON
  - No client-side API calls (except on-demand)

### 5.5 External Security Scoring
- [ ] Score calculation (0-15 points baseline)
  - Clean reputation across all APIs: 15 points
  - Some warnings: 10 points
  - Mixed signals: 5 points
  - Any critical threats: 0 points (and subtract from total)
- [ ] Threat level aggregation
  - Critical (malware, phishing): -50
  - High (spam, botnet): -30
  - Medium (suspicious): -15
  - Low (poor SSL): -5

**Deliverables**:
- `src/services/externalAPIs/` (directory with per-API modules)
- `src/utils/externalSecurityScoring.ts`
- `src/config/externalAPIs.json`
- `.github/workflows/external-checks.yml`
- Privacy consent UI components

---

## Priority 6: Composite Scoring Framework (Integration)

**Why Next**: Combine all scoring components into unified system.

### 6.1 Updated Scoring Formula
```
Total Score (0-100) =
  Rule Quality (35%) × normalized_rule_score +
  Network Health (25%) × network_score +
  Metadata Quality (25%) × metadata_score +
  External Security (15%) × external_score

Where:
- Rule Quality: 0-37.5 normalized to 0-35
- Network Health: 0-25
- Metadata Quality: 0-25
- External Security: 0-15
```

### 6.2 Confidence Calculation
- [ ] Multi-factor confidence scoring
  - Data completeness: % of available data sources
  - Data freshness: time since last update
  - External validation: consensus across APIs
  - Data consistency: agreement between sources
- [ ] Confidence levels:
  - 90-100%: High confidence (all data sources, recent, consistent)
  - 70-89%: Medium confidence (most data, reasonable age)
  - 50-69%: Low confidence (limited data, stale, or inconsistent)
  - <50%: Very low confidence (minimal data)

### 6.3 Time-Based Adjustments
- [ ] New instance penalty
  - <30 days old: -10 points overall
  - Note: "New instance, limited history"
- [ ] Stale data penalty
  - Data >30 days old: reduce confidence by 20%
  - Data >90 days old: reduce confidence by 50%
  - Show "last updated" timestamp prominently
- [ ] Instance offline handling
  - If offline >7 days: freeze score, show as historical
  - If offline >30 days: flag as "likely defunct"

### 6.4 Comparative Scoring (Percentiles)
- [ ] Calculate percentiles across known instances
  - Show "Better than X% of known instances"
  - Percentile badges (Top 10%, Top 25%, etc.)
- [ ] Category-specific comparisons
  - "Moderation: Top 5% of Mastodon instances"
  - "Network: Better than 75% of similar-size instances"

**Deliverables**:
- `src/utils/compositeScoring.ts`
- Updated `reportGenerator.ts` with new formula
- Confidence calculation engine
- Percentile ranking system

---

## Priority 7: UI/UX Enhancements (Polish)

**Why Last**: Requires all scoring components to be complete.

### 7.1 Enhanced Score Display
- [ ] Visual score breakdown chart
  - Pie or bar chart showing component contributions
  - Color-coded segments
  - Interactive tooltips
- [ ] Confidence indicator
  - Visual confidence meter
  - Explanation of confidence factors
  - Data freshness indicators
- [ ] Percentile badges
  - "Top 10%" badges for high performers
  - Comparison to similar instances

### 7.2 Detailed Reports
- [ ] Expandable sections for each scoring component
  - Rule analysis (already done in Priority 1)
  - Network health details
  - Metadata quality breakdown
  - External security check results
- [ ] Historical data display
  - Show archived data for offline instances
  - Indicate data source and age
  - Timeline of score changes (if available)
- [ ] Export functionality
  - JSON export of full report
  - PDF generation (optional)
  - Share link generation

### 7.3 Batch Analysis
- [ ] Bulk input interface
  - Textarea for multiple domains
  - CSV upload support
  - Import from fediverse software (e.g., Mastodon peers list)
- [ ] Batch processing
  - Queue system for multiple domains
  - Progress indicator
  - Parallel analysis (rate-limited)
- [ ] Comparison view
  - Side-by-side comparison table
  - Sort by score components
  - Filter by criteria

### 7.4 Search & Filter
- [ ] Instance search
  - Search pre-computed instances by domain
  - Filter by software type
  - Filter by score range
- [ ] Advanced filters
  - By federation size
  - By age
  - By specific score components
  - By flags/warnings
- [ ] Saved searches
  - Save filter combinations
  - Export filtered results

### 7.5 External Security Results Display
- [ ] Per-API status indicators
  - ✓ Clean / ⚠️ Warning / ✗ Threat
  - Visual timeline of checks
  - Links to external reports (VirusTotal, etc.)
- [ ] Threat details
  - Severity levels with color coding
  - Threat descriptions
  - Remediation suggestions
- [ ] Check status
  - Which APIs were checked
  - Which were skipped (reason)
  - Last check timestamp
  - "Request recheck" button (queues for next batch)

**Deliverables**:
- Enhanced UI components in `src/components/`
- Chart library integration (e.g., recharts)
- Batch analysis interface
- Search/filter components
- Export utilities

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Priority 2: Data Management Layer
- Basic caching system
- Configuration management

### Phase 2: Core Scoring (Week 3-4)
- Priority 3: Enhanced Metadata Scoring
- Priority 4: Dynamic Network Health Scoring
- Create reputation lists

### Phase 3: External Validation (Week 5-6)
- Priority 5: External API Integration (Phase 1 - priority APIs)
- Rate limiting and error handling
- Privacy controls

### Phase 4: Integration (Week 7-8)
- Priority 6: Composite Scoring Framework
- Confidence calculations
- Percentile rankings

### Phase 5: Polish (Week 9-10)
- Priority 7: UI/UX Enhancements
- Batch analysis
- Search/filter
- External API Integration Phase 2 (secondary APIs)

---

## Success Metrics

- [ ] Comprehensive scoring (all 7 components implemented)
- [ ] <2 second average analysis time (with cache)
- [ ] >90% cache hit rate for known instances
- [ ] Zero API key exposure client-side
- [ ] Graceful degradation (works without external APIs)
- [ ] Mobile-responsive UI
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Documentation complete

---

## Next Immediate Steps

1. Create data management layer (cacheManager.ts)
2. Implement API configuration system
3. Set up GitHub Actions for pre-computation
4. Build metadata scoring engine
5. Create instance reputation lists
