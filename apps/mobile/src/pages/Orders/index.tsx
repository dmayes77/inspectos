import "./orders.css";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHistory, useParams } from "react-router-dom";
import { IonIcon, IonSpinner, IonText } from "@ionic/react";
import { briefcaseOutline, businessOutline, calendarOutline, chevronForwardOutline, homeOutline, personOutline, searchOutline } from "ionicons/icons";
import { useAuth } from "../../contexts/AuthContext";
import { getOrders } from "../../services/api";
import { MobilePageLayout } from "../../components/MobilePageLayout";
import { mobileQueryKeys } from "../../lib/query-keys";

function formatScheduleFriendly(scheduledDate?: string | null, scheduledTime?: string | null): string {
  if (!scheduledDate) return "Unscheduled";

  const [yearRaw, monthRaw, dayRaw] = scheduledDate.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(" ");
  }

  let hours = 0;
  let minutes = 0;
  if (scheduledTime) {
    const [hoursRaw, minutesRaw] = scheduledTime.split(":");
    hours = Number(hoursRaw);
    minutes = Number(minutesRaw);
  }

  const date = new Date(year, month - 1, day, hours, minutes);
  if (Number.isNaN(date.getTime())) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(" ");
  }

  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);

  if (!scheduledTime) return datePart;

  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `on ${datePart} at ${timePart}`;
}

function toStatusClass(status?: string | null): string {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "completed" || normalized === "submitted") return "is-completed";
  if (normalized === "in_progress") return "is-in-progress";
  if (normalized === "pending") return "is-pending";
  return "is-default";
}

function formatStatusLabel(status?: string | null): string {
  const normalized = (status ?? "").trim();
  if (!normalized) return "Active";
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatShortDate(scheduledDate?: string | null): string {
  if (!scheduledDate) return "---";
  const [yearRaw, monthRaw, dayRaw] = scheduledDate.split("-");
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
  if (Number.isNaN(date.getTime())) return scheduledDate;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function getPropertyIcon(property: unknown) {
  if (!property || typeof property !== "object") return homeOutline;
  const valueCandidates = [
    (property as Record<string, unknown>).property_type,
    (property as Record<string, unknown>).propertyType,
  ];
  const normalized = valueCandidates.find((value) => typeof value === "string");
  if (!normalized || typeof normalized !== "string") return homeOutline;
  const value = normalized.toLowerCase().trim();
  return value === "commercial" ? businessOutline : homeOutline;
}

function getPropertyImageUrl(property: unknown): string | null {
  if (!property || typeof property !== "object") return null;
  const propertyRecord = property as Record<string, unknown>;
  const candidates = [
    propertyRecord.avatar_url,
    propertyRecord.image_url,
    propertyRecord.photo_url,
    propertyRecord.cover_image_url,
    propertyRecord.cover_photo_url,
  ];
  const match = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
  return typeof match === "string" ? match.trim() : null;
}

export default function Orders() {
  const { tenant } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const history = useHistory();
  const [query, setQuery] = useState("");
  const ordersQuery = useQuery({
    queryKey: mobileQueryKeys.orders(tenantSlug),
    queryFn: () => getOrders(tenantSlug),
    enabled: Boolean(tenant),
  });
  const orders = useMemo(() => ordersQuery.data?.orders ?? [], [ordersQuery.data?.orders]);
  const properties = useMemo(() => ordersQuery.data?.properties ?? [], [ordersQuery.data?.properties]);
  const clients = useMemo(() => ordersQuery.data?.clients ?? [], [ordersQuery.data?.clients]);
  const loading = ordersQuery.isPending;
  const error = ordersQuery.error instanceof Error ? ordersQuery.error.message : null;

  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties]);
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const property = propertyById.get(order.property_id);
      const client = order.client_id ? clientById.get(order.client_id) : null;
      const haystack = [order.order_number, order.status, client?.name, property?.address_line1, property?.city, property?.state]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [orders, propertyById, clientById, query]);

  return (
    <MobilePageLayout title="Inspections" className="orders-page" contentClassName="orders-content">
      <div className="orders-search">
        <IonIcon icon={searchOutline} />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by client or address"
          aria-label="Search inspections"
        />
      </div>

      <button type="button" className="orders-archived">
        <span className="orders-archived-left">
          <IonIcon icon={briefcaseOutline} />
          Archived Inspections
        </span>
        <IonIcon icon={chevronForwardOutline} />
      </button>

      {loading ? (
        <div className="orders-loading">
          <IonSpinner name="crescent" />
        </div>
      ) : null}
      {error ? (
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
      ) : null}
      {!loading && !error && visibleOrders.length === 0 ? (
        <div className="orders-empty">
          <IonText color="medium">
            <p>No inspections found.</p>
          </IonText>
        </div>
      ) : null}
      {!loading && !error && visibleOrders.length > 0 ? (
        <div className="orders-list">
          {visibleOrders.map((order) => {
            const property = propertyById.get(order.property_id);
            const client = order.client_id ? clientById.get(order.client_id) : null;
            const streetAddress = property?.address_line1?.trim() || "Property unavailable";
            const cityState =
              [property?.city, property?.state].filter((value): value is string => Boolean(value && value.trim().length > 0)).join(", ") ||
              "City, State unavailable";
            const clientLabel = client?.name || order.order_number || "Inspection";
            const propertyIcon = getPropertyIcon(property);
            const propertyImageUrl = getPropertyImageUrl(property);
            return (
              <button key={order.id} type="button" className="orders-row" onClick={() => history.push(`/t/${tenantSlug}/order/${order.id}`)}>
                <span className={`orders-row-icon ${toStatusClass(order.status)}`}>
                  {propertyImageUrl ? (
                    <img
                      src={propertyImageUrl}
                      alt={streetAddress}
                      className="orders-row-avatar"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const nextSibling = event.currentTarget.nextElementSibling;
                        if (nextSibling instanceof HTMLElement) {
                          nextSibling.style.display = "";
                        }
                      }}
                    />
                  ) : null}
                  <IonIcon icon={propertyIcon} style={propertyImageUrl ? { display: "none" } : undefined} />
                </span>
                <div className="orders-row-main">
                  <div className="orders-row-topline">
                    <span className={`orders-row-status ${toStatusClass(order.status)}`}>{formatStatusLabel(order.status)}</span>
                    <span className="orders-row-order-number">{order.order_number || "Inspection"}</span>
                  </div>
                  <h3>{streetAddress}</h3>
                  <p className="orders-row-city-state">{cityState}</p>
                  <div className="orders-row-meta">
                    <p className="orders-row-client">
                      <IonIcon icon={personOutline} />
                      <span>{clientLabel}</span>
                    </p>
                    <p className="orders-row-time">
                      <IonIcon icon={calendarOutline} />
                      <span>{formatScheduleFriendly(order.scheduled_date, order.scheduled_time)}</span>
                    </p>
                  </div>
                </div>
                <div className="orders-row-side">
                  <span className="orders-row-date">{formatShortDate(order.scheduled_date)}</span>
                  <IonIcon className="orders-row-chevron" icon={chevronForwardOutline} />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
