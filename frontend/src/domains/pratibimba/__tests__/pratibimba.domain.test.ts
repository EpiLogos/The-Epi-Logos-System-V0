/**
 * Pratibimba Domain Tests
 * Unit tests for pure business logic functions
 */

import {
  updatePratibimbaGrowth,
  addKnowledgeConnection,
  exportPratibimba,
  isValidPratibimba,
  sanitizePratibimbaForDisplay
} from '../pratibimba.domain';
import { createPratibimbaSeed } from '../pratibimba.types';
import type { PersonalPratibimba } from '../pratibimba.types';

describe('Pratibimba Domain Logic', () => {
  let testPratibimba: PersonalPratibimba;

  beforeEach(() => {
    testPratibimba = createPratibimbaSeed('test-user-123');
  });

  describe('updatePratibimbaGrowth', () => {
    it('should update journal interaction patterns', () => {
      const updates = updatePratibimbaGrowth(testPratibimba, 'journal', {
        content: 'Exploring #1 Paramasiva and #2 Parashakti coordinates'
      });

      expect(updates.interactionPatterns?.journalingFrequency).toBe(1);
      expect(updates.growthNodes).toContain('#1');
      expect(updates.growthNodes).toContain('#2');
    });

    it('should extract Bimba coordinates from journal content', () => {
      const updates = updatePratibimbaGrowth(testPratibimba, 'journal', {
        content: 'Working with #0 Anuttara, #1-2 and #3.4.5 coordinates'
      });

      expect(updates.growthNodes).toHaveLength(3);
      expect(updates.growthNodes).toContain('#0');
      expect(updates.growthNodes).toContain('#1-2');
      expect(updates.growthNodes).toContain('#3.4.5');
    });

    it('should increment oracle consultation count', () => {
      const updates = updatePratibimbaGrowth(testPratibimba, 'oracle', {
        reading: 'test'
      });

      expect(updates.interactionPatterns?.oracleConsultations).toBe(1);
    });

    it('should update chat session duration average', () => {
      const updates = updatePratibimbaGrowth(testPratibimba, 'chat', {
        duration: 10
      });

      expect(updates.interactionPatterns?.chatSessionDuration).toBeGreaterThan(0);
    });

    it('should progress archetypal phase based on engagement', () => {
      // Simulate high engagement
      const engaged = {
        ...testPratibimba,
        interactionPatterns: {
          journalingFrequency: 25,
          oracleConsultations: 5,
          chatSessionDuration: 0,
          learningVelocity: 0
        }
      };

      const updates = updatePratibimbaGrowth(engaged, 'journal', { content: 'test' });

      expect(updates.archetypalPhase).toBe('Active Engagement');
      expect(updates.dominantArchetype).toBe('Explorer');
    });
  });

  describe('addKnowledgeConnection', () => {
    it('should create new knowledge connection', () => {
      const updates = addKnowledgeConnection(testPratibimba, '#1', '#2', 3);

      expect(updates.knowledgeConnections).toHaveLength(1);
      expect(updates.knowledgeConnections![0].from).toBe('#1');
      expect(updates.knowledgeConnections![0].to).toBe('#2');
      expect(updates.knowledgeConnections![0].strength).toBe(3);
    });

    it('should strengthen existing connection', () => {
      const withConnection = {
        ...testPratibimba,
        knowledgeConnections: [
          {
            from: '#1',
            to: '#2',
            strength: 3,
            firstDiscovered: new Date()
          }
        ]
      };

      const updates = addKnowledgeConnection(withConnection, '#1', '#2', 2);

      expect(updates.knowledgeConnections).toHaveLength(1);
      expect(updates.knowledgeConnections![0].strength).toBe(5);
    });

    it('should cap connection strength at 10', () => {
      const withConnection = {
        ...testPratibimba,
        knowledgeConnections: [
          {
            from: '#1',
            to: '#2',
            strength: 9,
            firstDiscovered: new Date()
          }
        ]
      };

      const updates = addKnowledgeConnection(withConnection, '#1', '#2', 5);

      expect(updates.knowledgeConnections![0].strength).toBe(10);
    });
  });

  describe('exportPratibimba', () => {
    it('should export Pratibimba as JSON blob', async () => {
      const blob = await exportPratibimba(testPratibimba, 'json');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should include export metadata', async () => {
      const blob = await exportPratibimba(testPratibimba, 'json');

      // Read blob as text (using FileReader for test env compatibility)
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });

      const data = JSON.parse(text);

      expect(data.format).toBe('json');
      expect(data.version).toBe('1.0.0');
      expect(data.data.userId).toBe('test-user-123');
      expect(data.exportedAt).toBeDefined();
    });
  });

  describe('isValidPratibimba', () => {
    it('should validate correct Pratibimba structure', () => {
      expect(isValidPratibimba(testPratibimba)).toBe(true);
    });

    it('should reject invalid Pratibimba', () => {
      const invalid = { userId: 'test' }; // Missing required fields
      expect(isValidPratibimba(invalid)).toBe(false);
    });

    it('should reject empty userId', () => {
      const invalidUser = { ...testPratibimba, userId: '' };
      expect(isValidPratibimba(invalidUser)).toBe(false);
    });
  });

  describe('sanitizePratibimbaForDisplay', () => {
    it('should include only safe display fields', () => {
      const sanitized = sanitizePratibimbaForDisplay(testPratibimba);

      expect(sanitized.archetypalPhase).toBeDefined();
      expect(sanitized.growthNodes).toBeDefined();
      expect(sanitized.interactionPatterns).toBeDefined();
      expect(sanitized.userId).toBeUndefined(); // Sensitive field removed
    });
  });
});
