/**
 * Inspection data hooks
 * React Query hooks for fetching inspection details (answers, findings, signatures)
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchInspectionData,
  getSeverityColor,
  getSeverityLabel,
  groupAnswersBySection,
  calculateCompletionPercentage,
  countFindingsBySeverity,
  type InspectionDataResponse,
  type InspectionAnswer,
  type InspectionFinding,
  type InspectionSignature,
  type MediaAsset,
  type TemplateSection,
  type InspectionWithData,
} from '@/lib/data/inspection-data';

const INSPECTION_DATA_KEY = 'inspection-data';

export function useInspectionData(inspectionId: string) {
  return useQuery({
    queryKey: [INSPECTION_DATA_KEY, inspectionId],
    queryFn: () => fetchInspectionData(inspectionId),
    enabled: !!inspectionId,
  });
}

// Re-export utility functions
export {
  getSeverityColor,
  getSeverityLabel,
  groupAnswersBySection,
  calculateCompletionPercentage,
  countFindingsBySeverity,
};

// Re-export types
export type {
  InspectionDataResponse,
  InspectionAnswer,
  InspectionFinding,
  InspectionSignature,
  MediaAsset,
  TemplateSection,
  InspectionWithData,
};
