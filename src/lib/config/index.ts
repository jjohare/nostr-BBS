/**
 * Configuration Module
 * Central export for configuration types, loader, and permissions
 */

// Environment config (relay URL, admin pubkey, etc.)
export {
	RELAY_URL,
	ADMIN_PUBKEY,
	APP_NAME,
	APP_VERSION,
	NDK_CONFIG,
	TIMEOUTS,
	validateConfig
} from './environment';

// Types
export type {
	RoleId,
	CohortId,
	SectionId,
	CalendarAccessLevel,
	ChannelVisibility,
	RoleConfig,
	CohortConfig,
	SectionConfig,
	SectionAccessConfig,
	SectionCalendarConfig,
	SectionFeaturesConfig,
	SectionUIConfig,
	CalendarAccessLevelConfig,
	ChannelVisibilityConfig,
	AppConfig,
	SuperuserConfig,
	SectionsConfig,
	UserSectionRole,
	UserPermissions
} from './types';

// Loader functions
export {
	loadConfig,
	saveConfig,
	clearConfigCache,
	getAppConfig,
	getSuperuser,
	isSuperuser,
	getRoles,
	getRole,
	getCohorts,
	getCohort,
	getSections,
	getSection,
	getDefaultSection,
	getSectionsByAccess,
	getCalendarAccessLevel,
	roleHasCapability,
	roleIsHigherThan,
	getHighestRole,
	getSectionConfigMap,
	SECTION_CONFIG
} from './loader';

// Re-export SectionId as ChannelSection for backward compatibility
export type { SectionId as ChannelSection } from './types';

// Permission functions
export {
	hasCapability,
	canAccessSection,
	getEffectiveRole,
	canManageSection,
	canModerateSection,
	canCreateChannel,
	canViewCalendar,
	canViewCalendarDetails,
	canCreateCalendarEvent,
	isGlobalAdmin,
	isSectionAdmin,
	getAccessibleSections,
	getManageableSections,
	createDefaultPermissions,
	createAdminPermissions,
	addSectionRole,
	removeSectionRole,
	addCohort,
	removeCohort
} from './permissions';
