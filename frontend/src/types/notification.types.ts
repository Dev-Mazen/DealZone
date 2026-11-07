/**
 * Notification Type Definitions
 * Maps to backend DTOs in DealZone.Application.Notifications.DTOs
 */

// ============================================================================
// Response DTOs
// ============================================================================

export interface NotificationResponse {
  id: string; // Guid
  userId: string; // Guid
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null; // Guid
  isRead: boolean;
  readAtUtc: string | null; // ISO datetime
  createdAtUtc: string; // ISO datetime
}

export interface UnreadCountResponse {
  unreadCount: number;
}
