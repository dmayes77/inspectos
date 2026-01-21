import { database, generateId, nowISO } from '../database';
import { outboxRepository } from './outbox';

export type InspectionStatus = 'draft' | 'in_progress' | 'completed' | 'submitted';

export interface Inspection {
  id: string;
  job_id: string;
  tenant_id: string;
  template_id: string;
  template_version: number;
  inspector_id: string;
  status: InspectionStatus;
  started_at: string | null;
  completed_at: string | null;
  weather_conditions: string | null;
  temperature: string | null;
  present_parties: string | null; // JSON array
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface Answer {
  id: string;
  inspection_id: string;
  template_item_id: string;
  section_id: string;
  value: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  inspection_id: string;
  section_id: string | null;
  template_item_id: string | null;
  defect_library_id: string | null;
  title: string;
  description: string | null;
  severity: 'minor' | 'moderate' | 'major' | 'safety';
  location: string | null;
  recommendation: string | null;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  inspection_id: string;
  signer_name: string;
  signer_type: 'inspector' | 'client' | 'agent' | 'other';
  signature_data: string;
  signed_at: string;
}

export const inspectionsRepository = {
  /**
   * Create a new inspection for a job
   */
  async create(
    jobId: string,
    tenantId: string,
    templateId: string,
    templateVersion: number,
    inspectorId: string
  ): Promise<string> {
    const id = generateId();
    const now = nowISO();

    await database.run(
      `INSERT INTO inspections (id, job_id, tenant_id, template_id, template_version,
                                inspector_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [id, jobId, tenantId, templateId, templateVersion, inspectorId, now, now]
    );

    // Add to outbox
    await outboxRepository.add({
      entityType: 'inspection',
      entityId: id,
      operation: 'upsert',
      payload: {
        id, job_id: jobId, tenant_id: tenantId, template_id: templateId,
        template_version: templateVersion, inspector_id: inspectorId,
        status: 'draft', created_at: now, updated_at: now
      }
    });

    return id;
  },

  /**
   * Get inspection by ID
   */
  async getById(id: string): Promise<Inspection | null> {
    const results = await database.query<Inspection>(
      `SELECT * FROM inspections WHERE id = ?`,
      [id]
    );
    return results[0] || null;
  },

  /**
   * Get inspection by job ID
   */
  async getByJobId(jobId: string): Promise<Inspection | null> {
    const results = await database.query<Inspection>(
      `SELECT * FROM inspections WHERE job_id = ?`,
      [jobId]
    );
    return results[0] || null;
  },

  /**
   * Start an inspection
   */
  async start(id: string): Promise<void> {
    const now = nowISO();
    await database.run(
      `UPDATE inspections SET status = 'in_progress', started_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );

    const inspection = await this.getById(id);
    if (inspection) {
      await outboxRepository.add({
        entityType: 'inspection',
        entityId: id,
        operation: 'upsert',
        payload: inspection
      });
    }
  },

  /**
   * Complete an inspection
   */
  async complete(id: string): Promise<void> {
    const now = nowISO();
    await database.run(
      `UPDATE inspections SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id]
    );

    const inspection = await this.getById(id);
    if (inspection) {
      await outboxRepository.add({
        entityType: 'inspection',
        entityId: id,
        operation: 'upsert',
        payload: inspection
      });
    }
  },

  /**
   * Update inspection metadata
   */
  async updateMetadata(
    id: string,
    data: {
      weather_conditions?: string;
      temperature?: string;
      present_parties?: string[];
      notes?: string;
    }
  ): Promise<void> {
    const now = nowISO();
    await database.run(
      `UPDATE inspections
       SET weather_conditions = COALESCE(?, weather_conditions),
           temperature = COALESCE(?, temperature),
           present_parties = COALESCE(?, present_parties),
           notes = COALESCE(?, notes),
           updated_at = ?
       WHERE id = ?`,
      [
        data.weather_conditions,
        data.temperature,
        data.present_parties ? JSON.stringify(data.present_parties) : null,
        data.notes,
        now,
        id
      ]
    );
  },

  /**
   * Get unsynced inspections
   */
  async getUnsynced(): Promise<Inspection[]> {
    return database.query<Inspection>(
      `SELECT * FROM inspections WHERE synced_at IS NULL`
    );
  },

  /**
   * Mark inspection as synced
   */
  async markSynced(id: string): Promise<void> {
    await database.run(
      `UPDATE inspections SET synced_at = ? WHERE id = ?`,
      [nowISO(), id]
    );
  },

  // ==================== ANSWERS ====================

  /**
   * Save an answer
   */
  async saveAnswer(
    inspectionId: string,
    templateItemId: string,
    sectionId: string,
    value: string | null,
    notes: string | null = null
  ): Promise<string> {
    // Check if answer already exists
    const existing = await database.query<Answer>(
      `SELECT id FROM answers WHERE inspection_id = ? AND template_item_id = ?`,
      [inspectionId, templateItemId]
    );

    const now = nowISO();
    let id: string;

    if (existing.length > 0) {
      id = existing[0].id;
      await database.run(
        `UPDATE answers SET value = ?, notes = ?, updated_at = ? WHERE id = ?`,
        [value, notes, now, id]
      );
    } else {
      id = generateId();
      await database.run(
        `INSERT INTO answers (id, inspection_id, template_item_id, section_id, value, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, inspectionId, templateItemId, sectionId, value, notes, now, now]
      );
    }

    // Add to outbox
    await outboxRepository.add({
      entityType: 'answer',
      entityId: id,
      operation: 'upsert',
      payload: {
        id, inspection_id: inspectionId, template_item_id: templateItemId,
        section_id: sectionId, value, notes, updated_at: now
      }
    });

    return id;
  },

  /**
   * Get all answers for an inspection
   */
  async getAnswers(inspectionId: string): Promise<Answer[]> {
    return database.query<Answer>(
      `SELECT * FROM answers WHERE inspection_id = ?`,
      [inspectionId]
    );
  },

  /**
   * Get answers by section
   */
  async getAnswersBySection(inspectionId: string, sectionId: string): Promise<Answer[]> {
    return database.query<Answer>(
      `SELECT * FROM answers WHERE inspection_id = ? AND section_id = ?`,
      [inspectionId, sectionId]
    );
  },

  // ==================== FINDINGS ====================

  /**
   * Create a finding
   */
  async createFinding(
    inspectionId: string,
    data: Omit<Finding, 'id' | 'inspection_id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const id = generateId();
    const now = nowISO();

    await database.run(
      `INSERT INTO findings (id, inspection_id, section_id, template_item_id, defect_library_id,
                            title, description, severity, location, recommendation,
                            estimated_cost_min, estimated_cost_max, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, inspectionId, data.section_id, data.template_item_id, data.defect_library_id,
        data.title, data.description, data.severity, data.location, data.recommendation,
        data.estimated_cost_min, data.estimated_cost_max, now, now
      ]
    );

    // Add to outbox
    await outboxRepository.add({
      entityType: 'finding',
      entityId: id,
      operation: 'upsert',
      payload: { id, inspection_id: inspectionId, ...data, created_at: now, updated_at: now }
    });

    return id;
  },

  /**
   * Update a finding
   */
  async updateFinding(id: string, data: Partial<Omit<Finding, 'id' | 'inspection_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const now = nowISO();
    const sets: string[] = ['updated_at = ?'];
    const values: unknown[] = [now];

    if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
    if (data.severity !== undefined) { sets.push('severity = ?'); values.push(data.severity); }
    if (data.location !== undefined) { sets.push('location = ?'); values.push(data.location); }
    if (data.recommendation !== undefined) { sets.push('recommendation = ?'); values.push(data.recommendation); }
    if (data.estimated_cost_min !== undefined) { sets.push('estimated_cost_min = ?'); values.push(data.estimated_cost_min); }
    if (data.estimated_cost_max !== undefined) { sets.push('estimated_cost_max = ?'); values.push(data.estimated_cost_max); }

    values.push(id);

    await database.run(
      `UPDATE findings SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated finding and add to outbox
    const findings = await database.query<Finding>(`SELECT * FROM findings WHERE id = ?`, [id]);
    if (findings[0]) {
      await outboxRepository.add({
        entityType: 'finding',
        entityId: id,
        operation: 'upsert',
        payload: findings[0]
      });
    }
  },

  /**
   * Delete a finding
   */
  async deleteFinding(id: string): Promise<void> {
    await database.run(`DELETE FROM findings WHERE id = ?`, [id]);
    await outboxRepository.add({
      entityType: 'finding',
      entityId: id,
      operation: 'delete',
      payload: { id }
    });
  },

  /**
   * Get all findings for an inspection
   */
  async getFindings(inspectionId: string): Promise<Finding[]> {
    return database.query<Finding>(
      `SELECT * FROM findings WHERE inspection_id = ? ORDER BY created_at ASC`,
      [inspectionId]
    );
  },

  // ==================== SIGNATURES ====================

  /**
   * Add a signature
   */
  async addSignature(
    inspectionId: string,
    signerName: string,
    signerType: Signature['signer_type'],
    signatureData: string
  ): Promise<string> {
    const id = generateId();
    const now = nowISO();

    await database.run(
      `INSERT INTO signatures (id, inspection_id, signer_name, signer_type, signature_data, signed_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, inspectionId, signerName, signerType, signatureData, now]
    );

    await outboxRepository.add({
      entityType: 'signature',
      entityId: id,
      operation: 'upsert',
      payload: {
        id, inspection_id: inspectionId, signer_name: signerName,
        signer_type: signerType, signature_data: signatureData, signed_at: now
      }
    });

    return id;
  },

  /**
   * Get signatures for an inspection
   */
  async getSignatures(inspectionId: string): Promise<Signature[]> {
    return database.query<Signature>(
      `SELECT * FROM signatures WHERE inspection_id = ?`,
      [inspectionId]
    );
  }
};
