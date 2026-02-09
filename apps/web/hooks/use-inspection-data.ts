/**
 * Inspection data hooks
 * React Query hooks for fetching inspection details (answers, findings, signatures)
 */

import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api/tenant-context';

const INSPECTION_DATA_KEY = 'inspection-data';

export interface InspectionAnswer {
  id: string;
  template_item_id: string;
  section_id: string;
  value: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionFinding {
  id: string;
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
  media?: MediaAsset[];
}

export interface InspectionSignature {
  id: string;
  signer_name: string;
  signer_type: 'inspector' | 'client' | 'agent' | 'other';
  signature_data: string; // Base64 encoded
  signed_at: string;
}

export interface MediaAsset {
  id: string;
  finding_id: string | null;
  answer_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size?: number;
  caption: string | null;
  created_at: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  item_type: 'checkbox' | 'rating' | 'text' | 'number' | 'select' | 'photo';
  options: unknown;
  is_required: boolean;
  sort_order: number;
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  template_items: TemplateItem[];
}

export interface InspectionWithData {
  id: string;
  order_id: string | null;
  tenant_id: string;
  template_id: string;
  template_version: number;
  inspector_id: string;
  status: 'draft' | 'in_progress' | 'completed' | 'submitted';
  started_at: string | null;
  completed_at: string | null;
  weather_conditions: string | null;
  temperature: string | null;
  present_parties: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    scheduled_date: string | null;
    status: string;
    property?: {
      id: string;
      address_line1: string;
      address_line2: string | null;
      city: string;
      state: string;
      zip_code: string;
      property_type: string;
      year_built: number | null;
      square_feet: number | null;
    };
    client?: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
    } | null;
  };
  template?: {
    id: string;
    name: string;
    description: string | null;
    template_sections: TemplateSection[];
  };
  inspector?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  vendorIds?: string[];
  vendors?: any[];
}

export interface InspectionDataResponse {
  inspection: InspectionWithData;
  answers: InspectionAnswer[];
  findings: InspectionFinding[];
  signatures: InspectionSignature[];
  media: MediaAsset[];
}

export function useInspectionData(inspectionId: string) {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: [INSPECTION_DATA_KEY, inspectionId],
    queryFn: async () => {
      return await apiClient.get<InspectionDataResponse>(`/admin/inspections/${inspectionId}/data`);
    },
    enabled: !!inspectionId,
  });
}

/**
 * Get severity color class for a finding
 */
export function getSeverityColor(severity: InspectionFinding['severity']): string {
  switch (severity) {
    case 'safety':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'major':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'minor':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get severity label for display
 */
export function getSeverityLabel(severity: InspectionFinding['severity']): string {
  switch (severity) {
    case 'safety':
      return 'Safety Concern';
    case 'major':
      return 'Major Issue';
    case 'moderate':
      return 'Moderate Issue';
    case 'minor':
      return 'Minor Issue';
    default:
      return severity;
  }
}

/**
 * Group answers by section for easier template rendering
 */
export function groupAnswersBySection(
  answers: InspectionAnswer[],
  sections: TemplateSection[]
): Map<string, { section: TemplateSection; answers: Map<string, InspectionAnswer> }> {
  const grouped = new Map<string, { section: TemplateSection; answers: Map<string, InspectionAnswer> }>();

  // Initialize with all sections
  for (const section of sections) {
    grouped.set(section.id, {
      section,
      answers: new Map(),
    });
  }

  // Add answers to their sections
  for (const answer of answers) {
    const sectionData = grouped.get(answer.section_id);
    if (sectionData) {
      sectionData.answers.set(answer.template_item_id, answer);
    }
  }

  return grouped;
}

/**
 * Calculate inspection completion percentage
 */
export function calculateCompletionPercentage(
  answers: InspectionAnswer[],
  sections: TemplateSection[]
): number {
  const totalItems = sections.reduce((sum, section) => sum + section.template_items.length, 0);
  if (totalItems === 0) return 100;

  const answeredItems = answers.filter((a) => a.value !== null && a.value !== '').length;
  return Math.round((answeredItems / totalItems) * 100);
}

/**
 * Count findings by severity
 */
export function countFindingsBySeverity(findings: InspectionFinding[]): Record<string, number> {
  return findings.reduce(
    (acc, finding) => {
      acc[finding.severity] = (acc[finding.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
