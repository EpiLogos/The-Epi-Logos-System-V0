/**
 * Pratibimba Domain Logic
 * Pure business logic for Personal Pratibimba growth and evolution
 * Zero React dependencies - domain-driven design
 */

import type {
  PersonalPratibimba,
  PratibimbaGrowthEvent,
  PratibimbaExport
} from './pratibimba.types';

/**
 * Update Pratibimba growth based on user interaction
 * Simple frequency tracking and pattern recognition (no ML complexity)
 */
export function updatePratibimbaGrowth(
  current: PersonalPratibimba,
  interactionType: 'journal' | 'oracle' | 'chat',
  data: any
): Partial<PersonalPratibimba> {
  const updates: Partial<PersonalPratibimba> = {
    lastModified: new Date(),
    version: current.version + 1
  };

  // Update interaction patterns
  const patterns = { ...current.interactionPatterns };

  if (interactionType === 'journal') {
    patterns.journalingFrequency += 1;

    // Extract potential Bimba coordinates from content
    const newNodes = extractBimbaCoordinates(data.content || '');
    if (newNodes.length > 0) {
      updates.growthNodes = [...new Set([...current.growthNodes, ...newNodes])];
    }
  }

  if (interactionType === 'oracle') {
    patterns.oracleConsultations += 1;
  }

  if (interactionType === 'chat') {
    // Update average session duration
    const currentAvg = patterns.chatSessionDuration;
    const sessionMinutes = data.duration || 5; // default 5min
    patterns.chatSessionDuration = (currentAvg + sessionMinutes) / 2;
  }

  // Calculate learning velocity (nodes per week)
  patterns.learningVelocity = calculateLearningVelocity(current);

  updates.interactionPatterns = patterns;

  // Archetypal phase progression based on engagement
  const archetypalUpdate = determineArchetypalPhase(current, patterns);
  if (archetypalUpdate) {
    updates.archetypalPhase = archetypalUpdate.phase;
    updates.dominantArchetype = archetypalUpdate.archetype;
  }

  return updates;
}

/**
 * Extract Bimba coordinate references from text content
 * Simple regex pattern matching for #N or #N-N-N format
 */
function extractBimbaCoordinates(text: string): string[] {
  const pattern = /#(\d+(?:[-\.]\d+)*)/g;
  const matches = text.match(pattern);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Calculate learning velocity based on growth history
 * Nodes unlocked per week (simple average)
 */
function calculateLearningVelocity(pratibimba: PersonalPratibimba): number {
  const ageInWeeks = Math.max(
    1,
    Math.floor(
      (Date.now() - pratibimba.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
  );

  return Math.round((pratibimba.growthNodes.length / ageInWeeks) * 10) / 10;
}

/**
 * Determine archetypal phase based on engagement patterns
 * Simple threshold-based progression (no ML)
 */
function determineArchetypalPhase(
  current: PersonalPratibimba,
  patterns: PersonalPratibimba['interactionPatterns']
): { phase: string; archetype: string } | null {
  const totalEngagement =
    patterns.journalingFrequency +
    patterns.oracleConsultations +
    (patterns.chatSessionDuration > 0 ? 5 : 0);

  // Phase progression thresholds
  if (totalEngagement >= 50 && current.archetypalPhase !== 'Deep Integration') {
    return { phase: 'Deep Integration', archetype: 'Sage' };
  }

  if (totalEngagement >= 20 && current.archetypalPhase === 'Initial Awakening') {
    return { phase: 'Active Engagement', archetype: 'Explorer' };
  }

  return null;
}

/**
 * Add knowledge connection between Bimba coordinates
 */
export function addKnowledgeConnection(
  current: PersonalPratibimba,
  from: string,
  to: string,
  strength: number = 1
): Partial<PersonalPratibimba> {
  // Check if connection already exists
  const existingIndex = current.knowledgeConnections.findIndex(
    (conn) => conn.from === from && conn.to === to
  );

  const connections = [...current.knowledgeConnections];

  if (existingIndex >= 0) {
    // Strengthen existing connection
    connections[existingIndex] = {
      ...connections[existingIndex],
      strength: Math.min(10, connections[existingIndex].strength + strength)
    };
  } else {
    // Add new connection
    connections.push({
      from,
      to,
      strength,
      firstDiscovered: new Date()
    });
  }

  return {
    knowledgeConnections: connections,
    lastModified: new Date(),
    version: current.version + 1
  };
}

/**
 * Export Pratibimba data for backup/portability
 */
export async function exportPratibimba(
  pratibimba: PersonalPratibimba,
  format: 'json' | 'encrypted' = 'json'
): Promise<Blob> {
  const exportData: PratibimbaExport = {
    format,
    data: pratibimba,
    exportedAt: new Date(),
    version: '1.0.0'
  };

  if (format === 'json') {
    const jsonString = JSON.stringify(exportData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  // Encrypted export (future implementation)
  // For now, just return JSON
  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

/**
 * Validate Pratibimba data structure
 */
export function isValidPratibimba(data: any): data is PersonalPratibimba {
  return (
    data &&
    typeof data.userId === 'string' &&
    data.userId.length > 0 &&
    data.createdAt instanceof Date &&
    typeof data.version === 'number' &&
    typeof data.archetypalPhase === 'string' &&
    Array.isArray(data.growthNodes) &&
    typeof data.interactionPatterns === 'object' &&
    typeof data.syncState === 'object'
  );
}

/**
 * Sanitize Pratibimba for display (remove sensitive data)
 */
export function sanitizePratibimbaForDisplay(
  pratibimba: PersonalPratibimba
): Partial<PersonalPratibimba> {
  return {
    archetypalPhase: pratibimba.archetypalPhase,
    dominantArchetype: pratibimba.dominantArchetype,
    growthNodes: pratibimba.growthNodes,
    interactionPatterns: pratibimba.interactionPatterns,
    syncState: {
      ...pratibimba.syncState,
      lastSyncedAt: pratibimba.syncState.lastSyncedAt
    }
  };
}
