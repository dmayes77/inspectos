/**
 * Database types - auto-generated from actual database schema
 * These types represent the actual structure of tables in the database
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'inspector';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CRM Types
// ============================================================================

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  client_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Partner Types
// ============================================================================

export interface Agency {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  tenant_id: string;
  agency_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  tenant_id: string;
  name: string;
  vendor_type: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Order & Inspection Types
// ============================================================================

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  client_id: string | null;
  agent_id: string | null;
  inspector_id: string | null;
  property_id: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'pending_report' | 'delivered' | 'completed' | 'cancelled';
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  completed_at: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  report_delivered_at: string | null;
  source: string | null;
  internal_notes: string | null;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  tenant_id: string;
  order_id: string | null;
  order_schedule_id: string | null;
  inspector_id: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'pending_report';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  base_price: number;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Join Table Types (Many-to-Many)
// ============================================================================

export interface InspectionService {
  id: string;
  inspection_id: string;
  service_id: string | null;
  template_id: string | null;
  inspector_id: string | null;
  vendor_id: string | null;
  name: string;
  price: number;
  duration_minutes: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionAssignment {
  id: string;
  tenant_id: string;
  inspection_id: string;
  inspector_id: string;
  role: 'lead' | 'assistant' | 'tech';
  assigned_at: string;
  unassigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderSchedule {
  id: string;
  tenant_id: string;
  order_id: string;
  schedule_type: string;
  label: string | null;
  service_id: string | null;
  package_id: string | null;
  inspector_id: string | null;
  slot_date: string;
  slot_start: string;
  slot_end: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagAssignment {
  id: string;
  tenant_id: string;
  scope: 'lead' | 'client' | 'inspection' | 'invoice' | 'job' | 'payment' | 'service' | 'template';
  entity_id: string;
  tag_id: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface PayoutItem {
  id: string;
  payout_id: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface PayRuleService {
  id: string;
  pay_rule_id: string;
  service_id: string;
  created_at: string;
}

export interface PackageItem {
  id: string;
  package_id: string;
  service_id: string;
  quantity: number;
  created_at: string;
}

export interface TemplateItem {
  id: string;
  section_id: string;
  item_type: string;
  name: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
  options: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Other Entity Types
// ============================================================================

export interface Tag {
  id: string;
  tenant_id: string;
  name: string;
  scope: string;
  tag_type: 'stage' | 'status' | 'segment' | 'source' | 'priority' | 'custom';
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  order_id: string | null;
  client_id: string;
  invoice_number: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string | null;
  order_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  tenant_id: string;
  inspector_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  template_type: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  name: string;
  subject: string;
  body: string;
  category: string | null;
  description: string | null;
  is_system: boolean;
  system_key: string | null;
  created_at: string;
  updated_at: string;
}

// Note: Webhook and WebhookDelivery types are defined in ./webhook.ts

export interface Workflow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  trigger_scope: string;
  trigger_type: string;
  trigger_tag_id: string | null;
  conditions: Record<string, unknown>;
  actions: unknown[];
  delay_minutes: number;
  is_active: boolean;
  is_system: boolean;
  system_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  tenant_id: string;
  workflow_id: string;
  scope: string;
  entity_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: Record<string, unknown>;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Integration {
  id: string;
  tenant_id: string;
  name: string;
  integration_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderNote {
  id: string;
  tenant_id: string;
  order_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Inspection Data Types
// ============================================================================

export interface Answer {
  id: string;
  tenant_id: string;
  inspection_id: string;
  inspection_service_id: string | null;
  item_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  tenant_id: string;
  inspection_id: string;
  inspection_service_id: string | null;
  title: string;
  description: string | null;
  severity: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  tenant_id: string;
  inspection_id: string;
  signer_type: string;
  signer_name: string;
  signature_data: string;
  signed_at: string;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  tenant_id: string;
  inspection_id: string | null;
  finding_id: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  caption: string | null;
  created_at: string;
  updated_at: string;
}
