export interface Component {
  id: string;
  label: string;
  icon: string;
  tier: 'client' | 'edge' | 'compute' | 'data' | 'async';
  kind: string;
}

export const COMPONENTS: Component[] = [
  { id: 'client', label: 'Web / mobile client', icon: '📱', tier: 'client', kind: 'client' },
  { id: 'dns', label: 'DNS / GeoDNS', icon: '📖', tier: 'edge', kind: 'dns' },
  { id: 'cdn', label: 'CDN', icon: '🌍', tier: 'edge', kind: 'cdn' },
  { id: 'lb', label: 'Load balancer', icon: '⚖️', tier: 'edge', kind: 'lb' },
  { id: 'gateway', label: 'API gateway', icon: '🚪', tier: 'edge', kind: 'gateway' },
  { id: 'ratelimit', label: 'Rate limiter', icon: '🚦', tier: 'edge', kind: 'gateway' },
  { id: 'app', label: 'App servers (stateless)', icon: '🖥️', tier: 'compute', kind: 'server' },
  { id: 'ws', label: 'WebSocket gateways', icon: '🔌', tier: 'compute', kind: 'server' },
  { id: 'workers', label: 'Background workers', icon: '👷', tier: 'compute', kind: 'worker' },
  { id: 'idgen', label: 'ID generator', icon: '🔢', tier: 'compute', kind: 'service' },
  { id: 'geo', label: 'Geo index (in-memory)', icon: '🗺️', tier: 'data', kind: 'cache' },
  { id: 'cache', label: 'Cache (Redis)', icon: '⚡', tier: 'data', kind: 'cache' },
  { id: 'sql', label: 'Relational DB', icon: '🐘', tier: 'data', kind: 'db' },
  { id: 'nosql', label: 'Wide-column / KV DB', icon: '📊', tier: 'data', kind: 'db' },
  { id: 'replicas', label: 'Read replicas', icon: '📄', tier: 'data', kind: 'db' },
  { id: 'blob', label: 'Object storage (S3)', icon: '🪣', tier: 'data', kind: 'storage' },
  { id: 'search', label: 'Search index', icon: '🔎', tier: 'data', kind: 'search' },
  { id: 'queue', label: 'Message queue / Kafka', icon: '📬', tier: 'async', kind: 'queue' },
  { id: 'push', label: 'Push notifications', icon: '🔔', tier: 'async', kind: 'external' },
  { id: 'stream', label: 'Stream processing', icon: '🌊', tier: 'async', kind: 'worker' },
  { id: 'warehouse', label: 'Data warehouse', icon: '🏬', tier: 'async', kind: 'db' },
];

export interface Scenario {
  id: string;
  title: string;
  prompt: string;
  hints: string[];
  must: Record<string, string>;
  good: Record<string, string>;
  overkill: Record<string, string>;
  /** an essential can be satisfied by an equally valid alternative component */
  alt?: Record<string, string>;
  reference: { nodes: { id: string; x: number; y: number; sub?: string }[]; edges: [string, string, string?][] };
  lesson: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'shortener',
    title: 'URL shortener',
    prompt: '100M new links/month, ~100:1 reads to writes, redirects must be fast (< 50 ms) and highly available. Optional click analytics.',
    hints: ['Which path is hot: create or redirect?', 'Where do unique codes come from?', 'Should analytics slow down redirects?'],
    must: {
      client: 'Users create and open short links.',
      lb: 'Spreads traffic over stateless servers and removes unhealthy ones.',
      app: 'Handles create + redirect logic; stateless so it scales horizontally.',
      cache: 'Redirects are read-heavy (100:1): hot codes served from memory in ~1 ms.',
      nosql: 'Pure key-value access (code → long URL) at TB scale. (A sharded relational DB is also acceptable.)',
    },
    good: {
      idgen: 'Range-based ID allocation avoids collisions without a central bottleneck.',
      queue: 'Click events go async so analytics never slow redirects.',
      cdn: 'Can cache redirects for viral links at the edge.',
      ratelimit: 'Protects link creation from spam/abuse.',
      sql: 'A sharded relational DB keyed by code also works.',
      stream: 'Aggregates click events for analytics.',
    },
    overkill: {
      ws: 'No real-time push needed.',
      geo: 'No location queries.',
      search: 'No full-text search requirement.',
      blob: 'Records are tiny; no files to store.',
      push: 'No notifications in scope.',
    },
    reference: {
      nodes: [
        { id: 'client', x: 80, y: 200 },
        { id: 'cdn', x: 260, y: 80, sub: 'viral redirects' },
        { id: 'lb', x: 260, y: 230 },
        { id: 'app', x: 460, y: 230 },
        { id: 'idgen', x: 460, y: 370 },
        { id: 'cache', x: 680, y: 120 },
        { id: 'nosql', x: 680, y: 260 },
        { id: 'queue', x: 460, y: 80, sub: 'click events' },
      ],
      edges: [
        ['client', 'cdn'],
        ['client', 'lb'],
        ['lb', 'app'],
        ['app', 'idgen', 'ID blocks'],
        ['app', 'cache'],
        ['app', 'nosql', 'on miss'],
        ['app', 'queue', 'async'],
      ],
    },
    alt: { nosql: 'sql' },
    lesson: 'design-a-url-shortener',
  },
  {
    id: 'photos',
    title: 'Photo sharing (Instagram-lite)',
    prompt: 'Users upload photos (2 MB each, 100M/day), follow others, and scroll a feed. Images must load fast worldwide.',
    hints: ['Where do the photo bytes go?', 'Who resizes images, and when?', 'How do images reach users far away?'],
    must: {
      client: 'Mobile app uploads and views.',
      lb: 'Front door for API traffic.',
      app: 'Upload, post and feed APIs.',
      blob: 'Photos are big blobs → object storage, metadata in DB.',
      cdn: 'Images delivered from edge locations worldwide.',
      queue: 'Upload events trigger async image processing.',
      workers: 'Resize/convert images without slowing uploads.',
      sql: 'Users, posts, follows: relational metadata (sharded). (Wide-column also acceptable.)',
    },
    good: {
      cache: 'Feed timelines and hot posts in Redis.',
      nosql: 'Likes/comments at high write volume.',
      gateway: 'Auth and routing across services.',
      replicas: 'Read-heavy metadata.',
      search: 'If user/hashtag search is in scope.',
      push: 'Notify followers / likes.',
    },
    overkill: {
      ws: 'Feed doesn’t need persistent connections (polling/pull to refresh is fine).',
      geo: 'No proximity queries in scope.',
      idgen: 'Fine to mention Snowflake IDs, but not a core component here.',
    },
    reference: {
      nodes: [
        { id: 'client', x: 80, y: 220 },
        { id: 'cdn', x: 270, y: 70, sub: 'image delivery' },
        { id: 'lb', x: 270, y: 230 },
        { id: 'app', x: 460, y: 230, sub: 'upload / post / feed' },
        { id: 'blob', x: 680, y: 70, sub: 'originals + sizes' },
        { id: 'queue', x: 680, y: 180 },
        { id: 'workers', x: 860, y: 120, sub: 'resize' },
        { id: 'sql', x: 680, y: 300, sub: 'posts, follows' },
        { id: 'cache', x: 460, y: 380, sub: 'feeds' },
      ],
      edges: [
        ['client', 'lb'],
        ['client', 'cdn'],
        ['client', 'blob', 'pre-signed upload'],
        ['lb', 'app'],
        ['blob', 'queue'],
        ['queue', 'workers'],
        ['workers', 'blob'],
        ['app', 'sql'],
        ['app', 'cache'],
        ['cdn', 'blob'],
      ],
    },
    alt: { sql: 'nosql' },
    lesson: 'design-instagram',
  },
  {
    id: 'chat',
    title: 'Chat app (WhatsApp-lite)',
    prompt: '1:1 and group messaging, delivered in < 500 ms when online, stored for offline users, with ✓✓ receipts. 50M DAU, ~230K messages/sec.',
    hints: ['How does the server push a message to a phone?', 'How do you find which server a user is connected to?', 'What happens if the receiver is offline?'],
    must: {
      client: 'Mobile apps keep a live connection.',
      lb: 'Distributes long-lived connections (least connections).',
      ws: 'Persistent WebSocket connections for real-time push.',
      cache: 'Session store: which gateway each user is connected to (and presence).',
      nosql: 'Massive write volume, read by conversation in time order.',
      push: 'Offline users get APNs/FCM notifications.',
    },
    good: {
      queue: 'Pub/sub between gateways and for async fan-out.',
      app: 'A message service that persists and routes.',
      blob: 'Media attachments (photos/videos).',
      idgen: 'Per-conversation ordered message IDs.',
      cdn: 'Media delivery.',
    },
    overkill: {
      search: 'Server-side search is often impossible with end-to-end encryption; not core.',
      geo: 'No location features.',
      warehouse: 'Not part of the core design.',
      sql: 'Relational DB for users/groups is fine, but messages shouldn’t go there at this scale.',
    },
    reference: {
      nodes: [
        { id: 'client', x: 80, y: 220 },
        { id: 'lb', x: 250, y: 220 },
        { id: 'ws', x: 430, y: 220 },
        { id: 'cache', x: 640, y: 80, sub: 'user → gateway' },
        { id: 'app', x: 640, y: 220, sub: 'message service' },
        { id: 'nosql', x: 860, y: 160, sub: 'messages' },
        { id: 'push', x: 860, y: 320, sub: 'offline' },
        { id: 'queue', x: 640, y: 360, sub: 'pub/sub' },
      ],
      edges: [
        ['client', 'lb'],
        ['lb', 'ws'],
        ['ws', 'cache'],
        ['ws', 'app'],
        ['app', 'nosql', 'persist'],
        ['app', 'queue'],
        ['queue', 'ws', 'route'],
        ['app', 'push'],
      ],
    },
    lesson: 'design-whatsapp-chat',
  },
  {
    id: 'rides',
    title: 'Ride sharing (Uber-lite)',
    prompt: '5M drivers send GPS every 4 s (~1.25M writes/sec). Riders must be matched to a nearby driver within seconds. A driver must never be assigned twice.',
    hints: ['Can a disk database absorb 1M location writes/sec?', 'How do you query “drivers near me”?', 'Which data needs strong consistency?'],
    must: {
      client: 'Rider and driver apps.',
      ws: 'Drivers stream locations; riders get live updates.',
      geo: 'In-memory geospatial index of current driver locations.',
      app: 'Matching and trip services.',
      sql: 'Trips need strong consistency (atomic assignment, state machine).',
      lb: 'Front door for connections and API calls.',
    },
    good: {
      queue: 'Location stream for history, analytics, ETA models.',
      cache: 'Driver status / sessions.',
      warehouse: 'Trip and location history for analytics.',
      push: 'Ride status notifications.',
      stream: 'Surge pricing computed from live supply/demand.',
    },
    overkill: {
      search: 'Text search isn’t core.',
      blob: 'No large files in the core flow.',
      cdn: 'Map tiles come from a maps provider; not core to matching.',
    },
    reference: {
      nodes: [
        { id: 'client', x: 80, y: 220 },
        { id: 'lb', x: 250, y: 220 },
        { id: 'ws', x: 430, y: 120, sub: 'location updates' },
        { id: 'geo', x: 660, y: 70 },
        { id: 'app', x: 430, y: 300, sub: 'matching + trips' },
        { id: 'sql', x: 660, y: 330, sub: 'trips' },
        { id: 'queue', x: 660, y: 200, sub: 'location stream' },
        { id: 'warehouse', x: 880, y: 200 },
      ],
      edges: [
        ['client', 'lb'],
        ['lb', 'ws'],
        ['lb', 'app'],
        ['ws', 'geo', 'update'],
        ['ws', 'queue'],
        ['queue', 'warehouse'],
        ['app', 'geo', 'nearby'],
        ['app', 'sql', 'assign'],
      ],
    },
    lesson: 'design-uber',
  },
  {
    id: 'video',
    title: 'Video streaming (YouTube-lite)',
    prompt: 'Creators upload multi-GB videos; viewers on any device and network watch with minimal buffering. Bandwidth is the biggest cost.',
    hints: ['What happens between upload and “ready to watch”?', 'How does quality adapt to the network?', 'Where do viewers fetch video segments from?'],
    must: {
      client: 'Players and uploader apps.',
      blob: 'Raw uploads and transcoded segments.',
      queue: 'Upload completion triggers processing jobs.',
      workers: 'Parallel transcoding into renditions/segments.',
      cdn: 'Serves segments close to viewers. The most important component.',
      app: 'Video metadata, upload and playback APIs.',
      sql: 'Video metadata (sharded). (Wide-column also acceptable.)',
    },
    good: {
      lb: 'Front door for API traffic.',
      cache: 'Hot metadata.',
      stream: 'View counts and watch-time aggregation.',
      search: 'Video search.',
      warehouse: 'Analytics and recommendations input.',
    },
    overkill: {
      ws: 'Playback uses HTTP segments, not WebSockets.',
      geo: 'No proximity queries.',
      idgen: 'Fine to mention, not a core component.',
    },
    reference: {
      nodes: [
        { id: 'client', x: 80, y: 220 },
        { id: 'lb', x: 250, y: 300 },
        { id: 'app', x: 440, y: 300, sub: 'metadata & upload API' },
        { id: 'sql', x: 660, y: 360 },
        { id: 'blob', x: 440, y: 120, sub: 'raw + segments' },
        { id: 'queue', x: 660, y: 120 },
        { id: 'workers', x: 860, y: 120, sub: 'transcode DAG' },
        { id: 'cdn', x: 250, y: 120 },
        { id: 'stream', x: 860, y: 300, sub: 'views' },
      ],
      edges: [
        ['client', 'lb'],
        ['lb', 'app'],
        ['app', 'sql'],
        ['client', 'blob', 'upload'],
        ['blob', 'queue'],
        ['queue', 'workers'],
        ['workers', 'blob'],
        ['client', 'cdn', 'segments'],
        ['cdn', 'blob'],
        ['app', 'stream', 'view events'],
      ],
    },
    alt: { sql: 'nosql' },
    lesson: 'design-youtube',
  },
];
