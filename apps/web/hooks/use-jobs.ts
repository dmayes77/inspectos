/**
 * Jobs hooks
 * React Query hooks for job management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchJobs,
  fetchJobById,
  createJob,
  updateJob,
  deleteJob,
  type Job,
  type CreateJobInput,
  type UpdateJobInput,
  type JobFilters,
} from '@/lib/data/jobs';

const JOBS_KEY = 'jobs';

export function useJobs(tenantSlug: string, filters?: JobFilters) {
  return useQuery({
    queryKey: [JOBS_KEY, tenantSlug, filters],
    queryFn: () => fetchJobs(tenantSlug, filters),
    enabled: !!tenantSlug,
  });
}

export function useJobById(id: string) {
  return useQuery({
    queryKey: [JOBS_KEY, id],
    queryFn: () => fetchJobById(id),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] });
      toast.success('Job created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create job');
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateJobInput) => updateJob(input),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] });
      queryClient.setQueryData([JOBS_KEY, job.id], job);
      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update job');
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] });
      toast.success('Job deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete job');
    },
  });
}

export type { Job, CreateJobInput, UpdateJobInput, JobFilters };
