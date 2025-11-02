/**
 * ResonancePanel Component Tests
 * Testing MEF resonance display and analysis trigger
 *
 * Story 08.13 - MEF Resonance Analysis
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResonancePanel } from '../ResonancePanel';
import type { EtymologySession, EtymologyCommunity, BimbaResonance } from '@/types/etymology.types';

// Mock fetch globally
global.fetch = jest.fn();

describe('ResonancePanel Component', () => {
  const mockSession: EtymologySession = {
    session_id: 'session-1',
    user_id: 'user-1',
    title: 'Test Session',
    description: 'Test description',
    thread_ids: [],
    words_explored: ['test', 'word'],
    communities_created: ['comm-1'],
    resonances_found: [],
    aphorisms: [],
    pie_roots_discovered: [],
    semantic_patterns: [],
    status: 'active' as any,
    coordinate_context: '#5-5',
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    metadata: {}
  };

  const mockResonance: BimbaResonance = {
    id: 'res-1',
    coordinate: '#2-1-0',
    coordinate_name: 'Parashakti Ground',
    resonance_type: 'semantic',
    resonance_strength: 0.85,
    description: 'Strong semantic resonance',
    detected_via_lens: 'archetypal',
    detected_via_tool: 'semantic_coordinate_discovery',
    reasoning_summary: 'This resonance was detected through archetypal lens analysis',
    deepseek_reasoning: 'Step 1: Analyzed words\nStep 2: Found patterns\nStep 3: Matched coordinate',
    detected_at: new Date().toISOString(),
    mef_archetypal: {
      lens_name: 'Archetypal',
      analysis: 'Deep archetypal analysis',
      key_patterns: ['pattern1', 'pattern2']
    },
    mef_causal: {
      lens_name: 'Causal',
      analysis: 'Causal analysis'
    }
  };

  const mockCommunity: EtymologyCommunity = {
    id: 'comm-1',
    group_id: 'user-1',
    name: 'Test Community',
    description: 'Test community description',
    quaternal_type: 'three_part' as any,
    words: ['word1', 'word2', 'word3'],
    pie_root: '*test-root',
    semantic_pattern: 'test pattern',
    session_id: 'session-1',
    user_id: 'user-1',
    bimba_coordinate: '#2-1-0',
    domain: 'EA',
    formed_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    bimba_resonances: [mockResonance],
    mef_resonance_count: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render loading state', () => {
    render(
      <ResonancePanel
        session={null}
        communities={[]}
        loading={true}
        onCoordinateClick={jest.fn()}
      />
    );

    expect(screen.getByText('Loading resonances...')).toBeInTheDocument();
  });

  it('should render no session state', () => {
    render(
      <ResonancePanel
        session={null}
        communities={[]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    expect(screen.getByText('Select or create a session to view Bimba resonances')).toBeInTheDocument();
  });

  it('should render no communities state', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    expect(screen.getByText('No Communities Yet')).toBeInTheDocument();
  });

  it('should render communities with resonances', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    expect(screen.getByText('Test Community (1 resonances)')).toBeInTheDocument();
    expect(screen.getByText('#2-1-0')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should trigger MEF analysis on button click', async () => {
    const mockRefetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        status: 'queued',
        is_reanalysis: false,
        message: 'MEF analysis queued'
      })
    });

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
        onRefetch={mockRefetch}
      />
    );

    const analyzeButton = screen.getByText('Analyze MEF');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/graphiti/etymology/communities/comm-1/analyze-mef'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Analyze MEF')).toBeInTheDocument();
    });
  });

  it('should display MEF analysis error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        detail: 'Community not found'
      })
    });

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    const analyzeButton = screen.getByText('Analyze MEF');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Error: Community not found/)).toBeInTheDocument();
    });
  });

  it('should display MEF reasoning summary', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    expect(screen.getByText('MEF Reasoning')).toBeInTheDocument();
    expect(screen.getByText('This resonance was detected through archetypal lens analysis')).toBeInTheDocument();
    expect(screen.getByText('Detected via: archetypal lens')).toBeInTheDocument();
  });

  it('should expand DeepSeek reasoning chain on click', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    const deepSeekButton = screen.getByText('DeepSeek Reasoning Chain');
    expect(screen.queryByText('Step 1: Analyzed words')).not.toBeInTheDocument();

    fireEvent.click(deepSeekButton);

    expect(screen.getByText(/Step 1: Analyzed words/)).toBeInTheDocument();
  });

  it('should expand MEF lens insights on click', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    const lensButton = screen.getByText('MEF Lens Insights (6 Lenses)');
    fireEvent.click(lensButton);

    expect(screen.getByText('Archetypal')).toBeInTheDocument();
    expect(screen.getByText('Causal')).toBeInTheDocument();
  });

  it('should expand individual lens details', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    // First expand the lens insights section
    const lensButton = screen.getByText('MEF Lens Insights (6 Lenses)');
    fireEvent.click(lensButton);

    // Then expand archetypal lens
    const archetypeButton = screen.getByText('Archetypal');
    fireEvent.click(archetypeButton);

    expect(screen.getByText(/Deep archetypal analysis/)).toBeInTheDocument();
  });

  it('should call onCoordinateClick when coordinate is clicked', () => {
    const mockCoordinateClick = jest.fn();

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={mockCoordinateClick}
      />
    );

    const coordinateElement = screen.getByText('#2-1-0');
    fireEvent.click(coordinateElement.closest('.cursor-pointer')!);

    expect(mockCoordinateClick).toHaveBeenCalledWith('#2-1-0');
  });

  it('should display resonance strength with correct color coding', () => {
    const { container } = render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    const strengthElement = screen.getByText('85%');
    expect(strengthElement).toHaveClass('text-green-600'); // >= 0.7
  });

  it('should display semantic resonance type badge', () => {
    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    const typeBadge = screen.getByText('semantic');
    expect(typeBadge).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('should show success toast on MEF analysis trigger', async () => {
    const mockRefetch = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        status: 'queued',
        is_reanalysis: false,
        message: 'MEF analysis queued'
      })
    });

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
        onRefetch={mockRefetch}
      />
    );

    const analyzeButton = screen.getByText('Analyze MEF');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      // Toast should be created in DOM
      const toast = document.querySelector('.bg-green-600');
      expect(toast).toBeInTheDocument();
      expect(toast?.textContent).toContain('MEF analysis started');
    });
  });

  it('should show error toast on MEF analysis failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        detail: 'Community not found'
      })
    });

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    const analyzeButton = screen.getByText('Analyze MEF');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      // Error toast should be created in DOM
      const toast = document.querySelector('.bg-red-600');
      expect(toast).toBeInTheDocument();
      expect(toast?.textContent).toContain('Community not found');
    });
  });

  it('should call refetch after 30 seconds on successful MEF analysis', async () => {
    jest.useFakeTimers();
    const mockRefetch = jest.fn();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        status: 'queued',
        is_reanalysis: false,
        message: 'MEF analysis queued'
      })
    });

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity]}
        loading={false}
        onCoordinateClick={jest.fn()}
        onRefetch={mockRefetch}
      />
    );

    const analyzeButton = screen.getByText('Analyze MEF');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('Analyze MEF')).toBeInTheDocument();
    });

    expect(mockRefetch).not.toHaveBeenCalled();

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('should display all 6 MEF lenses in expandable section', () => {
    const communityWithAllLenses: EtymologyCommunity = {
      ...mockCommunity,
      bimba_resonances: [{
        ...mockResonance,
        mef_archetypal: { analysis: 'Archetypal analysis' },
        mef_causal: { analysis: 'Causal analysis' },
        mef_logical: { analysis: 'Logical analysis' },
        mef_processual: { analysis: 'Processual analysis' },
        mef_meta_epistemic: { analysis: 'Meta-epistemic analysis' },
        mef_divine_scalar: { analysis: 'Divine-scalar analysis' }
      }]
    };

    render(
      <ResonancePanel
        session={mockSession}
        communities={[communityWithAllLenses]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    // Expand lens insights
    const lensButton = screen.getByText('MEF Lens Insights (6 Lenses)');
    fireEvent.click(lensButton);

    // Verify all 6 lenses are shown
    expect(screen.getByText('Archetypal')).toBeInTheDocument();
    expect(screen.getByText('Causal')).toBeInTheDocument();
    expect(screen.getByText('Logical')).toBeInTheDocument();
    expect(screen.getByText('Processual')).toBeInTheDocument();
    expect(screen.getByText('Meta-Epistemic')).toBeInTheDocument();
    expect(screen.getByText('Divine-Scalar')).toBeInTheDocument();
  });

  it('should not display lens that has no data', () => {
    const communityWithPartialLenses: EtymologyCommunity = {
      ...mockCommunity,
      bimba_resonances: [{
        ...mockResonance,
        mef_archetypal: { analysis: 'Archetypal analysis' },
        // Other lenses undefined
      }]
    };

    render(
      <ResonancePanel
        session={mockSession}
        communities={[communityWithPartialLenses]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    // Expand lens insights
    const lensButton = screen.getByText('MEF Lens Insights (6 Lenses)');
    fireEvent.click(lensButton);

    // Only archetypal should be shown
    expect(screen.getByText('Archetypal')).toBeInTheDocument();
    expect(screen.queryByText('Causal')).not.toBeInTheDocument();
    expect(screen.queryByText('Logical')).not.toBeInTheDocument();
  });

  it('should switch between communities correctly', () => {
    const mockCommunity2: EtymologyCommunity = {
      ...mockCommunity,
      id: 'comm-2',
      name: 'Second Community',
      bimba_resonances: []
    };

    render(
      <ResonancePanel
        session={mockSession}
        communities={[mockCommunity, mockCommunity2]}
        loading={false}
        onCoordinateClick={jest.fn()}
      />
    );

    // Initially shows first community
    expect(screen.getByText('Test Community (1 resonances)')).toBeInTheDocument();

    // Switch to second community
    const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(selectElement, { target: { value: 'comm-2' } });

    // Should now show second community
    expect(screen.getByText('Second Community (0 resonances)')).toBeInTheDocument();
  });
});
