/**
 * Pratibimba Domain Types
 * Personal Pratibimba data structures aligned with #4.4.4.4 coordinate
 */

export interface PersonalPratibimba {
  // Identity
  userId: string;
  createdAt: Date;
  lastModified: Date;
  version: number;

  // Archetypal State (slowly evolving through synthesis)
  archetypalPhase: string;           // Current alchemical phase
  dominantArchetype: string;          // Primary archetypal resonance
  shadowArchetype: string;            // Shadow integration work

  // Growth Tracking (unlocked through engagement)
  growthNodes: string[];              // Unlocked Bimba coordinates
  knowledgeConnections: Array<{       // Relational understanding
    from: string;
    to: string;
    strength: number;
    firstDiscovered: Date;
  }>;

  // Interaction Patterns (simple frequency tracking)
  interactionPatterns: {
    journalingFrequency: number;      // Entries per week
    oracleConsultations: number;      // Total oracle readings
    chatSessionDuration: number;      // Average minutes per session
    learningVelocity: number;         // New concepts per week
  };

  // Privacy & Sync State
  syncState: {
    lastSyncedAt: Date | null;
    cloudActive: boolean;             // Currently in Redis?
    localOnly: boolean;               // User opted out of cloud sync
  };
}

export interface SyncQueueItem {
  id?: number;
  action: 'update' | 'sync' | 'export';
  data: Partial<PersonalPratibimba>;
  timestamp: Date;
  synced: boolean;
  retryCount?: number;
}

export interface PratibimbaGrowthEvent {
  type: 'journal' | 'oracle' | 'chat' | 'node_unlock';
  timestamp: Date;
  data: any;
  newNodes?: string[];
  archetypalShift?: boolean;
}

export interface PratibimbaExport {
  format: 'json' | 'encrypted';
  data: PersonalPratibimba;
  exportedAt: Date;
  version: string;
}

// Initial seed for new users
export const createPratibimbaSeed = (userId: string): PersonalPratibimba => ({
  userId,
  createdAt: new Date(),
  lastModified: new Date(),
  version: 1,

  archetypalPhase: 'Initial Awakening',
  dominantArchetype: 'Seeker',
  shadowArchetype: 'Unknown',

  growthNodes: [],
  knowledgeConnections: [],

  interactionPatterns: {
    journalingFrequency: 0,
    oracleConsultations: 0,
    chatSessionDuration: 0,
    learningVelocity: 0
  },

  syncState: {
    lastSyncedAt: null,
    cloudActive: false,
    localOnly: false
  }
});
