export type InvoiceRecord = {
  invoiceId: string;
  invoiceNumber?: string;
  clientName: string;
  clientId?: string;
  orderId?: string | null;
  orderNumber?: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceDetail = InvoiceRecord & {
  clientId: string | null;
  orderId: string | null;
};

export interface CreateInvoiceInput {
  client_id: string | null;
  order_id: string;
  status: string;
  total: number;
  issued_at?: string | null;
  due_at?: string | null;
}

export interface UpdateInvoiceInput {
  client_id?: string | null;
  order_id?: string;
  status?: string;
  total?: number;
  issued_at?: string | null;
  due_at?: string | null;
}
