/**
 * Channel Types
 *
 * Section configuration is now loaded from config/sections.yaml
 * This file provides backward-compatible type exports
 */

// Import types for local use
import type {
	SectionId,
	ChannelVisibility as ChannelVisibilityType,
	CalendarAccessLevel as CalendarAccessLevelType,
	SectionConfig as SectionConfigType
} from '$lib/config';

// Re-export config-driven types with backward-compatible names
export type ChannelSection = SectionId;
export type ChannelVisibility = ChannelVisibilityType;
export type CalendarAccessLevel = CalendarAccessLevelType;
export type SectionConfig = SectionConfigType;

// Re-export config-driven values
export { SECTION_CONFIG, getSections, getSection } from '$lib/config';

/**
 * Section access status for a user
 */
export type SectionAccessStatus = 'none' | 'pending' | 'approved' | 'denied';

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
