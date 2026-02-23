-- Decision-engine foundation: add explicit cost inputs and derived margin fields to orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS travel_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_cost NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12,2) GENERATED ALWAYS AS (
    COALESCE(labor_cost, 0) +
    COALESCE(travel_cost, 0) +
    COALESCE(overhead_cost, 0) +
    COALESCE(other_cost, 0)
  ) STORED;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(12,2) GENERATED ALWAYS AS (
    COALESCE(total, 0) - (
      COALESCE(labor_cost, 0) +
      COALESCE(travel_cost, 0) +
      COALESCE(overhead_cost, 0) +
      COALESCE(other_cost, 0)
    )
  ) STORED;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gross_margin_pct NUMERIC(7,2) GENERATED ALWAYS AS (
    CASE
      WHEN COALESCE(total, 0) > 0 THEN (
        (
          COALESCE(total, 0) - (
            COALESCE(labor_cost, 0) +
            COALESCE(travel_cost, 0) +
            COALESCE(overhead_cost, 0) +
            COALESCE(other_cost, 0)
          )
        ) / COALESCE(total, 0)
      ) * 100
      ELSE NULL
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_margin
  ON public.orders (tenant_id, gross_margin DESC);
