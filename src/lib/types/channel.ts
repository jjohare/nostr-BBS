/**
 * Channel section categories (AREAS) for organizing chatrooms
 *
 * Access Model:
 * - Users can SEE section stats and public channel listings from outside
 * - Users must REQUEST ACCESS to enter a section
 * - Admin approves section access via whitelist
 * - Once approved for a section, user can join any 'public' channel in that section
 * - 'cohort' channels require explicit admin assignment (invisible until assigned)
 *
 * Sections:
 * - fairfield-guests: Open to all authenticated users, no approval needed
 * - minimoonoir-rooms: Observable stats, requires admin approval to enter
 * - dreamlab: Observable stats, requires admin approval to enter (experimental/creative)
 */
export type ChannelSection = 'fairfield-guests' | 'minimoonoir-rooms' | 'dreamlab';

/**
 * Channel visibility within a section
 * - public: Visible and joinable by all section members
 * - cohort: Only visible to users explicitly assigned by admin
 */
export type ChannelVisibility = 'public' | 'cohort';

/**
 * Section access status for a user
 */
export type SectionAccessStatus = 'none' | 'pending' | 'approved' | 'denied';

/**
 * Calendar access levels by section
 * - full: Can see all calendar events and details
 * - availability: Can see if dates are booked but not details
 * - cohort: Can see events tagged with their cohort only
 * - none: No calendar access
 */
export type CalendarAccessLevel = 'full' | 'availability' | 'cohort' | 'none';

/**
 * Section metadata for display
 */
export interface SectionConfig {
  name: string;
  description: string;
  icon: string;
  requiresApproval: boolean;
  showStats: boolean;
  calendarAccess: CalendarAccessLevel;
}

export const SECTION_CONFIG: Record<ChannelSection, SectionConfig> = {
  'fairfield-guests': {
    name: 'Fairfield Guests',
    description: 'Welcome area for visitors - open to all authenticated users',
    icon: '👋',
    requiresApproval: false,
    showStats: true,
    calendarAccess: 'full'  // Full calendar access for guests
  },
  'minimoonoir-rooms': {
    name: 'MiniMooNoir Rooms',
    description: 'Core community chatrooms - request access to join',
    icon: '🌙',
    requiresApproval: true,
    showStats: true,
    calendarAccess: 'full'  // Full calendar access for members
  },
  'dreamlab': {
    name: 'DreamLab',
    description: 'Creative and experimental projects - request access to join',
    icon: '✨',
    requiresApproval: true,
    showStats: true,
    calendarAccess: 'availability'  // Can see if weekends booked, not details
  }
};

/**
 * Section stats visible to all users
 */
export interface SectionStats {
  section: ChannelSection;
  channelCount: number;
  memberCount: number;
  messageCount: number;
  lastActivity: number;
}

/**
 * User's access to sections
 */
export interface UserSectionAccess {
  section: ChannelSection;
  status: SectionAccessStatus;
  requestedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  creatorPubkey: string;
  members: string[];
  admins: string[];
  pendingRequests: string[];
  cohortTags: string[];
  section: ChannelSection;
  visibility: ChannelVisibility;
  isEncrypted: boolean;
  encryptionKey?: string;
}

/**
 * Section access request (sent by user to admin)
 */
export interface SectionAccessRequest {
  id: string;
  section: ChannelSection;
  requesterPubkey: string;
  requestedAt: number;
  message?: string;
  status: SectionAccessStatus;
}

export interface Message {
  id: string;
  channelId: string;
  authorPubkey: string;
  content: string;
  createdAt: number;
  isEncrypted: boolean;
  decryptedContent?: string;
  tags?: string[][];
  replyTo?: string;
  quotedMessages?: string[];
}

export interface JoinRequest {
  channelId: string;
  requesterPubkey: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export type MemberStatus = 'member' | 'pending' | 'non-member' | 'admin';
