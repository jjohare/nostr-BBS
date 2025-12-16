/**
 * Configuration Types
 * Type definitions for YAML-based section configuration
 */

export type RoleId = 'guest' | 'member' | 'moderator' | 'section-admin' | 'admin';
export type CohortId = string;
export type SectionId = string;
export type CalendarAccessLevel = 'full' | 'availability' | 'cohort' | 'none';
export type ChannelVisibility = 'public' | 'cohort' | 'invite';

export interface RoleCapability {
	id: string;
	description?: string;
}

export interface RoleConfig {
	id: RoleId;
	name: string;
	level: number;
	description: string;
	capabilities?: string[];
}

export interface CohortConfig {
	id: CohortId;
	name: string;
	description: string;
}

export interface SectionAccessConfig {
	requiresApproval: boolean;
	defaultRole: RoleId;
	autoApprove: boolean;
	requiredCohorts?: CohortId[];
}

export interface SectionCalendarConfig {
	access: CalendarAccessLevel;
	canCreate: boolean;
	cohortRestricted?: boolean;
}

export interface SectionFeaturesConfig {
	showStats: boolean;
	allowChannelCreation: boolean;
	calendar: SectionCalendarConfig;
}

export interface SectionUIConfig {
	color: string;
}

export interface SectionConfig {
	id: SectionId;
	name: string;
	description: string;
	icon: string;
	order: number;
	access: SectionAccessConfig;
	features: SectionFeaturesConfig;
	ui: SectionUIConfig;
}

export interface CalendarAccessLevelConfig {
	id: CalendarAccessLevel;
	name: string;
	description: string;
	canView: boolean;
	canViewDetails: boolean | 'cohort-match';
}

export interface ChannelVisibilityConfig {
	id: ChannelVisibility;
	name: string;
	description: string;
}

export interface AppConfig {
	name: string;
	version: string;
	defaultSection: SectionId;
}

export interface SuperuserConfig {
	pubkey: string;
	name: string;
	relayUrl?: string;
}

export interface DeploymentConfig {
	relayUrl?: string;
	embeddingApiUrl?: string;
	gcsEmbeddingsUrl?: string;
	frontendUrl?: string;
}

export interface SectionsConfig {
	app: AppConfig;
	superuser?: SuperuserConfig;
	deployment?: DeploymentConfig;
	roles: RoleConfig[];
	cohorts: CohortConfig[];
	sections: SectionConfig[];
	calendarAccessLevels: CalendarAccessLevelConfig[];
	channelVisibility: ChannelVisibilityConfig[];
}

/**
 * User's role assignment for a section
 */
export interface UserSectionRole {
	sectionId: SectionId;
	role: RoleId;
	assignedAt: number;
	assignedBy?: string;
}

/**
 * User's complete permission state
 */
export interface UserPermissions {
	pubkey: string;
	cohorts: CohortId[];
	globalRole: RoleId;
	sectionRoles: UserSectionRole[];
}
