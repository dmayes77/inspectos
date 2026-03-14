import "./orders.css";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHistory, useParams } from "react-router-dom";
import { IonIcon, IonSpinner, IonText } from "@ionic/react";
import { briefcaseOutline, businessOutline, calendarOutline, chevronForwardOutline, homeOutline, personOutline, searchOutline } from "ionicons/icons";
import { formatOrderScheduleFriendly, formatOrderShortDate, formatOrderStatusLabel, getOrderStatusTone } from "@inspectos/domains/orders";
import { useAuth } from "../../contexts/AuthContext";
import { getOrders } from "../../services/api";
import { MobilePageLayout } from "../../components/MobilePageLayout";
import { mobileQueryKeys } from "../../lib/query-keys";

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
            const statusTone = getOrderStatusTone(order.status);
            return (
              <button key={order.id} type="button" className="orders-row" onClick={() => history.push(`/t/${tenantSlug}/order/${order.id}`)}>
                <span className={`orders-row-icon ${statusTone}`}>
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
                    <span className={`orders-row-status ${statusTone}`}>{formatOrderStatusLabel(order.status)}</span>
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
                      <span>{formatOrderScheduleFriendly(order.scheduled_date, order.scheduled_time, { includeWeekday: true, includeOnPrefix: true })}</span>
                    </p>
                  </div>
                </div>
                <div className="orders-row-side">
                  <span className="orders-row-date">{formatOrderShortDate(order.scheduled_date)}</span>
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
