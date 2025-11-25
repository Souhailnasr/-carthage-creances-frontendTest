export type TypeNotificationHuissier =
  | 'DELAY_WARNING'
  | 'DELAY_EXPIRED'
  | 'ACTION_PERFORMED'
  | 'AMIABLE_RESPONSE_POSITIVE'
  | 'AMIABLE_RESPONSE_NEGATIVE'
  | 'AMOUNT_UPDATED'
  | 'DOCUMENT_CREATED'
  | 'STATUS_CHANGED';

export type CanalNotification = 'IN_APP' | 'EMAIL' | 'SMS' | 'WEBHOOK';

export interface NotificationHuissier {
  id: number;
  dossierId: number;
  type: TypeNotificationHuissier;
  channel: CanalNotification;
  message: string;
  payload?: any;
  createdAt: string;
  sentAt?: string;
  acked: boolean;
  recommendationId?: number;
}


