export interface ModuleInfo {
  id: string;
  number: number;
  title: string;
  short: string;
  icon: string;
  color: string;
  blurb: string;
}

export const modules: ModuleInfo[] = [
  {
    id: 'm0',
    number: 0,
    title: 'Foundations: How the Internet Works',
    short: 'Networking Basics',
    icon: '🌐',
    color: '#0ea5e9',
    blurb: 'No networking knowledge needed. Learn what really happens between your browser and a server, and how to estimate scale.',
  },
  {
    id: 'm1',
    number: 1,
    title: 'Databases from Zero',
    short: 'Databases',
    icon: '🗄️',
    color: '#8b5cf6',
    blurb: 'Tables, indexes, transactions, NoSQL and search. Learn how data is stored and why the choice of database matters so much.',
  },
  {
    id: 'm2',
    number: 2,
    title: 'Core Building Blocks',
    short: 'Building Blocks',
    icon: '🧱',
    color: '#f59e0b',
    blurb: 'Load balancers, caches, CDNs, replication, sharding and queues. These are the Lego pieces of every large system.',
  },
  {
    id: 'm3',
    number: 3,
    title: 'Distributed Systems Thinking',
    short: 'Distributed Systems',
    icon: '🕸️',
    color: '#ef4444',
    blurb: 'What changes when your app runs on many machines? CAP, consistency, rate limiting, failures, consensus, locks and more.',
  },
  {
    id: 'm4',
    number: 4,
    title: 'APIs & Communication',
    short: 'APIs & Communication',
    icon: '🔌',
    color: '#10b981',
    blurb: 'REST vs GraphQL vs gRPC, real-time updates, microservices, auth, events and data processing.',
  },
  {
    id: 'm5',
    number: 5,
    title: 'Reliability & Operations',
    short: 'Reliability',
    icon: '🛡️',
    color: '#14b8a6',
    blurb: 'Keeping systems healthy: observability, availability math, disaster recovery and security basics.',
  },
  {
    id: 'm6',
    number: 6,
    title: 'The Interview Framework',
    short: 'Interview Framework',
    icon: '🎯',
    color: '#ec4899',
    blurb: 'A repeatable method to attack any design question, ask the right questions and defend your trade-offs.',
  },
  {
    id: 'm7',
    number: 7,
    title: 'Classic Interview Problems',
    short: 'Interview Problems',
    icon: '🏗️',
    color: '#6366f1',
    blurb: '18 full walkthroughs of the most asked problems. Each design grows step by step and every choice is explained.',
  },
  {
    id: 'm8',
    number: 8,
    title: 'Frontend System Design',
    short: 'Frontend System Design',
    icon: '🖥️',
    color: '#f97316',
    blurb: 'Your home ground. Rendering strategies, component architecture and classic frontend design rounds.',
  },
];

export const moduleById = Object.fromEntries(modules.map((m) => [m.id, m]));
