import { database, nowISO } from '../database';

export interface Template {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  version: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  synced_at: string;
}

export interface TemplateSection {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type TemplateItemType = 'checkbox' | 'rating' | 'text' | 'number' | 'select' | 'photo';

export interface TemplateItem {
  id: string;
  section_id: string;
  name: string;
  description: string | null;
  item_type: TemplateItemType;
  options: string | null; // JSON array
  is_required: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithSections extends Template {
  sections: (TemplateSection & { items: TemplateItem[] })[];
}

export const templatesRepository = {
  /**
   * Get all active templates for a tenant
   */
  async getAll(tenantId: string): Promise<Template[]> {
    return database.query<Template>(
      `SELECT * FROM templates WHERE tenant_id = ? AND is_active = 1 ORDER BY name`,
      [tenantId]
    );
  },

  /**
   * Get template by ID with all sections and items
   */
  async getWithSections(id: string): Promise<TemplateWithSections | null> {
    const templates = await database.query<Template>(
      `SELECT * FROM templates WHERE id = ?`,
      [id]
    );

    if (templates.length === 0) return null;

    const template = templates[0];

    const sections = await database.query<TemplateSection>(
      `SELECT * FROM template_sections WHERE template_id = ? ORDER BY sort_order`,
      [id]
    );

    const sectionsWithItems = await Promise.all(
      sections.map(async (section) => {
        const items = await database.query<TemplateItem>(
          `SELECT * FROM template_items WHERE section_id = ? ORDER BY sort_order`,
          [section.id]
        );
        return { ...section, items };
      })
    );

    return { ...template, sections: sectionsWithItems };
  },

  /**
   * Upsert a template (from server sync)
   */
  async upsertTemplate(template: Omit<Template, 'synced_at'>): Promise<void> {
    await database.run(
      `INSERT INTO templates (id, tenant_id, name, description, version, is_active, created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         version = excluded.version,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [
        template.id, template.tenant_id, template.name, template.description,
        template.version, template.is_active, template.created_at, template.updated_at, nowISO()
      ]
    );
  },

  /**
   * Upsert a section (from server sync)
   */
  async upsertSection(section: TemplateSection): Promise<void> {
    await database.run(
      `INSERT INTO template_sections (id, template_id, name, description, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         sort_order = excluded.sort_order,
         updated_at = excluded.updated_at`,
      [section.id, section.template_id, section.name, section.description, section.sort_order, section.created_at, section.updated_at]
    );
  },

  /**
   * Upsert an item (from server sync)
   */
  async upsertItem(item: TemplateItem): Promise<void> {
    await database.run(
      `INSERT INTO template_items (id, section_id, name, description, item_type, options, is_required, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         item_type = excluded.item_type,
         options = excluded.options,
         is_required = excluded.is_required,
         sort_order = excluded.sort_order,
         updated_at = excluded.updated_at`,
      [item.id, item.section_id, item.name, item.description, item.item_type, item.options, item.is_required, item.sort_order, item.created_at, item.updated_at]
    );
  },

  /**
   * Delete sections and items for a template (before re-syncing)
   */
  async clearTemplateChildren(templateId: string): Promise<void> {
    // Items are deleted by CASCADE when sections are deleted
    await database.run(
      `DELETE FROM template_sections WHERE template_id = ?`,
      [templateId]
    );
  },

  /**
   * Get sections for a template
   */
  async getSections(templateId: string): Promise<TemplateSection[]> {
    return database.query<TemplateSection>(
      `SELECT * FROM template_sections WHERE template_id = ? ORDER BY sort_order`,
      [templateId]
    );
  },

  /**
   * Get items for a section
   */
  async getItems(sectionId: string): Promise<TemplateItem[]> {
    return database.query<TemplateItem>(
      `SELECT * FROM template_items WHERE section_id = ? ORDER BY sort_order`,
      [sectionId]
    );
  },

  /**
   * Get item count for a template
   */
  async getItemCount(templateId: string): Promise<number> {
    const result = await database.query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM template_items ti
       JOIN template_sections ts ON ti.section_id = ts.id
       WHERE ts.template_id = ?`,
      [templateId]
    );
    return result[0]?.count || 0;
  }
};
