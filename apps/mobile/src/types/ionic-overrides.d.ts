/**
 * Type overrides to fix Ionic React + React type version conflicts
 *
 * This is needed because the web app uses React 19 and the types get hoisted
 * in the monorepo, causing conflicts with Ionic React which expects React 18 types.
 */

import type { JSX as IonicJSX } from "@ionic/react";

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends IonicJSX.IntrinsicElements {}
  }
}

declare module "@ionic/react" {
  export const IonApp: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonPage: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonHeader: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonToolbar: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonTitle: React.FC<React.PropsWithChildren<{ children?: React.ReactNode; size?: "large" | "small" }>>;
  export const IonContent: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonButton: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonInput: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonItem: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonLabel: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonList: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonCard: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonCardContent: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonCardHeader: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonCardTitle: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSpinner: React.FC<{ name?: string; style?: React.CSSProperties }>;
  export const IonChip: React.FC<React.PropsWithChildren<{ color?: string; onClick?: () => void; style?: React.CSSProperties }>>;
  export const IonIcon: React.FC<
    React.PropsWithChildren<{
      icon: string;
      slot?: string;
      color?: string;
      style?: React.CSSProperties;
    }>
  >;
  export const IonRouterOutlet: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonTabs: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonTabBar: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonTabButton: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonBadge: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonText: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonModal: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonLoading: React.FC<Record<string, unknown>>;
  export const IonToast: React.FC<Record<string, unknown>>;
  export const IonAlert: React.FC<Record<string, unknown>>;
  export const IonActionSheet: React.FC<Record<string, unknown>>;
  export const IonRefresher: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonRefresherContent: React.FC<Record<string, unknown>>;
  export const IonFab: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonFabButton: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonBackButton: React.FC<Record<string, unknown>>;
  export const IonButtons: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonMenuButton: React.FC<Record<string, unknown>>;
  export const IonMenu: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSplitPane: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonImg: React.FC<Record<string, unknown>>;
  export const IonThumbnail: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonAvatar: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonNote: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonCheckbox: React.FC<Record<string, unknown>>;
  export const IonRadio: React.FC<Record<string, unknown>>;
  export const IonRadioGroup: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonToggle: React.FC<Record<string, unknown>>;
  export const IonSelect: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSelectOption: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonTextarea: React.FC<Record<string, unknown>>;
  export const IonDatetime: React.FC<Record<string, unknown>>;
  export const IonRange: React.FC<Record<string, unknown>>;
  export const IonSegment: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSegmentButton: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSearchbar: React.FC<Record<string, unknown>>;
  export const IonFooter: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonGrid: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonRow: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonCol: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSlides: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSlide: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonInfiniteScroll: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonInfiniteScrollContent: React.FC<Record<string, unknown>>;
  export const IonVirtualScroll: React.FC<Record<string, unknown>>;
  export const IonItemDivider: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonItemGroup: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonItemSliding: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonItemOptions: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonItemOption: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonReorder: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonReorderGroup: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonSkeletonText: React.FC<Record<string, unknown>>;
  export const IonProgressBar: React.FC<Record<string, unknown>>;
  export const IonAccordion: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonAccordionGroup: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonBreadcrumb: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const IonBreadcrumbs: React.FC<React.PropsWithChildren<Record<string, unknown>>>;

  export function setupIonicReact(config?: Record<string, unknown>): void;
}

declare module "@ionic/react-router" {
  import { RouterProps } from "react-router";

  export const IonReactRouter: React.FC<React.PropsWithChildren<RouterProps>>;
  export const IonRouterOutlet: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
}
