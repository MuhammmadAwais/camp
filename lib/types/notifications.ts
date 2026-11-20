export type NotificationType =
  | "BID"
  | "KYC"
  | "MODERATION"
  | "AUCTION"
  | "MATCH"
  | "BILLING"
  | "DISPUTE"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  listingId: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResponse = {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  serverTime: string;
};

export type MarkNotificationsReadPayload = {
  markAll?: boolean;
  notificationIds?: string[];
};

export type MarkNotificationsReadResponse = {
  updatedCount: number;
  unreadCount: number;
  serverTime: string;
};

export type ClearNotificationsResponse = {
  deletedCount: number;
  unreadCount: number;
  serverTime: string;
};

export type CaslUnsubscribeResult = {
  unsubscribed: true;
  channel: "email" | "sms" | "all";
  emailMasked: string;
  recordedAt: string;
};
