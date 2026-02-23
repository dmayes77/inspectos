export type PaymentRecord = {
  paymentId: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  method: string;
  status: string;
  paidDate: string;
};

export type RecordPaymentInput = {
  order_id: string;
  amount: number;
  method: string;
  notes?: string;
};
