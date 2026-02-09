import { database, nowISO } from '../database';

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
  id: string;
  tenant_id: string;
  property_id: string;
  client_id: string | null;
  template_id: string;
  inspector_id: string;
  status: JobStatus;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface JobWithDetails extends Job {
  property_address: string;
  property_city: string;
  property_state: string;
  client_name: string | null;
  client_phone: string | null;
  template_name: string;
}

export const jobsRepository = {
  /**
   * Get all jobs for a date range
   */
  async getByDateRange(
    tenantId: string,
    inspectorId: string,
    startDate: string,
    endDate: string
  ): Promise<JobWithDetails[]> {
    return database.query<JobWithDetails>(
      `SELECT
        j.*,
        p.address_line1 || ', ' || p.city || ', ' || p.state || ' ' || p.zip_code as property_address,
        p.city as property_city,
        p.state as property_state,
        c.name as client_name,
        c.phone as client_phone,
        t.name as template_name
       FROM jobs j
       LEFT JOIN properties p ON j.property_id = p.id
       LEFT JOIN clients c ON j.client_id = c.id
       LEFT JOIN templates t ON j.template_id = t.id
       WHERE j.tenant_id = ?
         AND j.inspector_id = ?
         AND j.scheduled_date >= ?
         AND j.scheduled_date <= ?
       ORDER BY j.scheduled_date ASC, j.scheduled_time ASC`,
      [tenantId, inspectorId, startDate, endDate]
    );
  },

  /**
   * Get today's jobs
   */
  async getToday(tenantId: string, inspectorId: string): Promise<JobWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDateRange(tenantId, inspectorId, today, today);
  },

  /**
   * Get upcoming jobs (next 14 days)
   */
  async getUpcoming(tenantId: string, inspectorId: string): Promise<JobWithDetails[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 14);

    return this.getByDateRange(
      tenantId,
      inspectorId,
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  },

  /**
   * Get a single job by ID
   */
  async getById(id: string): Promise<JobWithDetails | null> {
    const results = await database.query<JobWithDetails>(
      `SELECT
        j.*,
        p.address_line1 || ', ' || p.city || ', ' || p.state || ' ' || p.zip_code as property_address,
        p.city as property_city,
        p.state as property_state,
        c.name as client_name,
        c.phone as client_phone,
        t.name as template_name
       FROM jobs j
       LEFT JOIN properties p ON j.property_id = p.id
       LEFT JOIN clients c ON j.client_id = c.id
       LEFT JOIN templates t ON j.template_id = t.id
       WHERE j.id = ?`,
      [id]
    );
    return results[0] || null;
  },

  /**
   * Update job status
   */
  async updateStatus(id: string, status: JobStatus): Promise<void> {
    await database.run(
      `UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?`,
      [status, nowISO(), id]
    );
  },

  /**
   * Upsert a job (from server sync)
   */
  async upsert(job: Omit<Job, 'synced_at'>): Promise<void> {
    await database.run(
      `INSERT INTO jobs (id, tenant_id, property_id, client_id, template_id, inspector_id,
                         status, scheduled_date, scheduled_time, duration_minutes, notes,
                         created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         property_id = excluded.property_id,
         client_id = excluded.client_id,
         template_id = excluded.template_id,
         inspector_id = excluded.inspector_id,
         status = excluded.status,
         scheduled_date = excluded.scheduled_date,
         scheduled_time = excluded.scheduled_time,
         duration_minutes = excluded.duration_minutes,
         notes = excluded.notes,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [
        job.id, job.tenant_id, job.property_id, job.client_id, job.template_id,
        job.inspector_id, job.status, job.scheduled_date, job.scheduled_time,
        job.duration_minutes, job.notes, job.created_at, job.updated_at, nowISO()
      ]
    );
  },

  /**
   * Get jobs by status
   */
  async getByStatus(tenantId: string, inspectorId: string, status: JobStatus): Promise<JobWithDetails[]> {
    return database.query<JobWithDetails>(
      `SELECT
        j.*,
        p.address_line1 || ', ' || p.city || ', ' || p.state || ' ' || p.zip_code as property_address,
        p.city as property_city,
        p.state as property_state,
        c.name as client_name,
        c.phone as client_phone,
        t.name as template_name
       FROM jobs j
       LEFT JOIN properties p ON j.property_id = p.id
       LEFT JOIN clients c ON j.client_id = c.id
       LEFT JOIN templates t ON j.template_id = t.id
       WHERE j.tenant_id = ?
         AND j.inspector_id = ?
         AND j.status = ?
       ORDER BY j.scheduled_date ASC, j.scheduled_time ASC`,
      [tenantId, inspectorId, status]
    );
  },

  /**
   * Delete old completed/cancelled jobs
   */
  async cleanupOld(daysOld = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await database.run(
      `DELETE FROM jobs
       WHERE status IN ('completed', 'cancelled')
         AND scheduled_date < ?`,
      [cutoff.toISOString().split('T')[0]]
    );
    return result.changes;
  }
};
