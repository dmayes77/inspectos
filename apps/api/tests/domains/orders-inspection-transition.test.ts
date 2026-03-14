import { describe, expect, it } from 'vitest';
import {
  buildInspectorScopeUserIds,
  hasInspectorMobileAccess,
  normalizeMembershipProfile,
  parseTransitionRequestBody,
  validateInspectionTransitionRequest,
} from '@inspectos/domains/orders';

describe('orders inspection transition domain', () => {
  it('parses a valid transition payload', () => {
    const parsed = parseTransitionRequestBody({
      event_id: 'evt-1',
      event_time: '2026-03-13T10:00:00.000Z',
      device_id: 'dev-1',
      state_machine_version: 'v1',
      from_state: 'assigned',
      to_state: 'arrived',
      trigger: 'ARRIVAL_CONFIRMED',
      checks: {
        order_assigned_to_inspector: true,
      },
      metadata: {
        source: 'test',
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.event_id).toBe('evt-1');
    expect(parsed?.trigger).toBe('ARRIVAL_CONFIRMED');
    expect(parsed?.checks?.order_assigned_to_inspector).toBe(true);
  });

  it('rejects malformed transition payloads', () => {
    const parsed = parseTransitionRequestBody({
      event_id: 'evt-2',
      event_time: '2026-03-13T10:00:00.000Z',
      device_id: 'dev-2',
      state_machine_version: 'v1',
      from_state: 'unknown_state',
      to_state: 'arrived',
      trigger: 'ARRIVAL_CONFIRMED',
    });

    expect(parsed).toBeNull();
  });

  it('accepts an allowed transition with required checks', () => {
    const parsed = parseTransitionRequestBody({
      event_id: 'evt-3',
      event_time: '2026-03-13T10:00:00.000Z',
      device_id: 'dev-3',
      state_machine_version: 'v1',
      from_state: 'assigned',
      to_state: 'arrived',
      trigger: 'ARRIVAL_CONFIRMED',
      checks: {
        order_assigned_to_inspector: true,
      },
    });

    if (!parsed) {
      throw new Error('expected parsed payload');
    }

    const result = validateInspectionTransitionRequest(parsed, 'order-123');
    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error('expected successful transition validation');
    }

    expect(result.result.order_id).toBe('order-123');
    expect(result.result.accepted).toBe(true);
    expect(result.result.missing_checks).toEqual([]);
    expect(new Date(result.result.accepted_at).toString()).not.toBe('Invalid Date');
  });

  it('returns missing checks for blocked transitions', () => {
    const parsed = parseTransitionRequestBody({
      event_id: 'evt-4',
      event_time: '2026-03-13T10:00:00.000Z',
      device_id: 'dev-4',
      state_machine_version: 'v1',
      from_state: 'ready_for_review',
      to_state: 'completed',
      trigger: 'QA_APPROVED',
      checks: {
        no_open_corrections: true,
      },
    });

    if (!parsed) {
      throw new Error('expected parsed payload');
    }

    const result = validateInspectionTransitionRequest(parsed, 'order-124');
    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error('expected transition validation failure');
    }

    expect(result.failure.code).toBe('TRANSITION_CHECKS_FAILED');
    if (result.failure.code === 'TRANSITION_CHECKS_FAILED') {
      expect(result.failure.missingChecks).toEqual([
        'required_items_completed',
        'required_evidence_uploaded',
      ]);
    }
  });

  it('rejects disallowed transitions', () => {
    const parsed = parseTransitionRequestBody({
      event_id: 'evt-5',
      event_time: '2026-03-13T10:00:00.000Z',
      device_id: 'dev-5',
      state_machine_version: 'v1',
      from_state: 'assigned',
      to_state: 'completed',
      trigger: 'QA_APPROVED',
      checks: {},
    });

    if (!parsed) {
      throw new Error('expected parsed payload');
    }

    const result = validateInspectionTransitionRequest(parsed, 'order-125');
    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error('expected transition validation failure');
    }

    expect(result.failure.code).toBe('TRANSITION_NOT_ALLOWED');
  });

  it('normalizes membership profile and inspector access checks', () => {
    expect(normalizeMembershipProfile(null)).toBeNull();
    expect(normalizeMembershipProfile([{ id: 'profile-1', is_inspector: true }])).toEqual({
      id: 'profile-1',
      is_inspector: true,
    });
    expect(normalizeMembershipProfile({ id: 'profile-2', is_inspector: false })).toEqual({
      id: 'profile-2',
      is_inspector: false,
    });

    expect(hasInspectorMobileAccess('owner')).toBe(true);
    expect(hasInspectorMobileAccess('admin')).toBe(true);
    expect(hasInspectorMobileAccess('inspector')).toBe(true);
    expect(hasInspectorMobileAccess('member', true)).toBe(true);
    expect(hasInspectorMobileAccess('member', false)).toBe(false);
  });

  it('builds inspector scoped user ids with profile fallback', () => {
    expect(buildInspectorScopeUserIds('user-1')).toEqual(['user-1']);
    expect(buildInspectorScopeUserIds('user-1', 'user-1')).toEqual(['user-1']);
    expect(buildInspectorScopeUserIds('user-1', 'profile-1')).toEqual(['user-1', 'profile-1']);
  });
});
