/**
 * Configuration Loader
 * Loads and parses YAML configuration at build time
 * Uses static import for Vite/SvelteKit compatibility
 */

import type {
	SectionsConfig,
	SectionConfig,
	RoleConfig,
	CohortConfig,
	CalendarAccessLevel,
	RoleId,
	SectionId,
	CohortId,
	SuperuserConfig
} from './types';

import { parse as parseYaml } from 'yaml';
import { browser } from '$app/environment';

// Default YAML config embedded at build time
// FAIRFIELD FORK: Hardcoded Fairfield/DreamLab/Cumbria configuration
const defaultConfigYaml = `
app:
  name: "Fairfield - DreamLab - Cumbria"
  version: "1.0.0"
  defaultSection: "fairfield-guests"

superuser:
  pubkey: ""
  name: "Instance Owner"
  relayUrl: ""

roles:
  - id: "guest"
    name: "Guest"
    level: 0
    description: "Basic authenticated user"
  - id: "member"
    name: "Member"
    level: 1
    description: "Approved section member"
  - id: "moderator"
    name: "Moderator"
    level: 2
    description: "Can manage channels and moderate"
    capabilities: ["channel.create", "channel.delete", "message.pin", "message.delete"]
  - id: "section-admin"
    name: "Section Admin"
    level: 3
    description: "Section administrator"
    capabilities: ["section.manage", "member.approve", "member.remove", "channel.create", "channel.delete", "message.pin", "message.delete"]
  - id: "admin"
    name: "Admin"
    level: 4
    description: "Global administrator"
    capabilities: ["admin.global", "section.create", "section.delete", "section.manage", "member.approve", "member.remove", "channel.create", "channel.delete", "message.pin", "message.delete", "user.whitelist"]

cohorts:
  - id: "admin"
    name: "Administrators"
    description: "Global system administrators"
  - id: "approved"
    name: "Approved Users"
    description: "Manually approved by admin"
  - id: "business"
    name: "Business Partners"
    description: "Business collaborators"
  - id: "moomaa-tribe"
    name: "Moomaa Tribe"
    description: "Core community members"
  - id: "fairfield-residents"
    name: "Fairfield Residents"
    description: "Local community members"

sections:
  - id: "fairfield-guests"
    name: "Fairfield Guests"
    description: "Welcome area for visitors - open to all authenticated users"
    icon: "wave"
    order: 1
    access:
      requiresApproval: false
      defaultRole: "guest"
      autoApprove: true
    features:
      showStats: true
      allowChannelCreation: false
      calendar:
        access: "full"
        canCreate: false
    ui:
      color: "#6366f1"

  - id: "minimoonoir-rooms"
    name: "MiniMooNoir"
    description: "Core community chatrooms - request access to join"
    icon: "moon"
    order: 2
    access:
      requiresApproval: true
      defaultRole: "member"
      autoApprove: false
    features:
      showStats: true
      allowChannelCreation: true
      calendar:
        access: "full"
        canCreate: true
    ui:
      color: "#8b5cf6"

  - id: "dreamlab"
    name: "DreamLab"
    description: "Creative and experimental projects - request access to join"
    icon: "lightbulb"
    order: 3
    access:
      requiresApproval: true
      defaultRole: "member"
      autoApprove: false
    features:
      showStats: true
      allowChannelCreation: true
      calendar:
        access: "availability"
        canCreate: true
        cohortRestricted: true
    ui:
      color: "#ec4899"

calendarAccessLevels:
  - id: "full"
    name: "Full Access"
    description: "All details visible"
    canView: true
    canViewDetails: true
  - id: "availability"
    name: "Availability Only"
    description: "Dates only"
    canView: true
    canViewDetails: false
  - id: "cohort"
    name: "Cohort Restricted"
    description: "Cohort match required"
    canView: true
    canViewDetails: "cohort-match"
  - id: "none"
    name: "No Access"
    description: "Hidden"
    canView: false
    canViewDetails: false

channelVisibility:
  - id: "public"
    name: "Public"
    description: "All section members"
  - id: "cohort"
    name: "Cohort Only"
    description: "Assigned cohorts"
  - id: "invite"
    name: "Invite Only"
    description: "Explicit invites"
`;

const STORAGE_KEY = 'nostr_bbs_custom_config';

let cachedConfig: SectionsConfig | null = null;

/**
 * Load and parse the sections configuration
 * Checks localStorage for custom config, falls back to default
 */
export function loadConfig(): SectionsConfig {
	if (cachedConfig) {
		return cachedConfig;
	}

	// Check for custom config in localStorage (set during setup)
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const customConfig = JSON.parse(stored) as SectionsConfig;
				validateConfig(customConfig);
				cachedConfig = customConfig;
				return cachedConfig;
			}
		} catch (error) {
			console.warn('[Config] Invalid stored config, using default:', error);
		}
	}

	// Fall back to default config
	try {
		cachedConfig = parseYaml(defaultConfigYaml) as SectionsConfig;
		validateConfig(cachedConfig);
		return cachedConfig;
	} catch (error) {
		console.error('[Config] Failed to parse default config:', error);
		return getDefaultConfig();
	}
}

/**
 * Save custom configuration to localStorage
 */
export function saveConfig(config: SectionsConfig): void {
	if (!browser) return;

	try {
		validateConfig(config);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		cachedConfig = config;
	} catch (error) {
		console.error('[Config] Failed to save configuration:', error);
		throw error;
	}
}

/**
 * Clear cached config (forces reload)
 */
export function clearConfigCache(): void {
	cachedConfig = null;
}

/**
 * Validate configuration structure
 */
function validateConfig(config: SectionsConfig): void {
	if (!config.app?.name) {
		throw new Error('Missing app.name in configuration');
	}
	if (!config.sections?.length) {
		throw new Error('No sections defined in configuration');
	}
	if (!config.roles?.length) {
		throw new Error('No roles defined in configuration');
	}

	// Validate section references
	const roleIds = new Set(config.roles.map((r) => r.id));
	for (const section of config.sections) {
		if (!roleIds.has(section.access.defaultRole)) {
			throw new Error(
				`Section ${section.id} references unknown role: ${section.access.defaultRole}`
			);
		}
	}
}

/**
 * Get default configuration (fallback)
 * FAIRFIELD FORK: Hardcoded Fairfield/DreamLab/Cumbria configuration
 */
function getDefaultConfig(): SectionsConfig {
	return {
		app: {
			name: 'Fairfield - DreamLab - Cumbria',
			version: '1.0.0',
			defaultSection: 'fairfield-guests'
		},
		roles: [
			{ id: 'guest', name: 'Guest', level: 0, description: 'Basic authenticated user' },
			{ id: 'member', name: 'Member', level: 1, description: 'Approved section member' },
			{
				id: 'moderator',
				name: 'Moderator',
				level: 2,
				description: 'Can manage channels and moderate',
				capabilities: ['channel.create', 'channel.delete', 'message.pin', 'message.delete']
			},
			{
				id: 'section-admin',
				name: 'Section Admin',
				level: 3,
				description: 'Section administrator',
				capabilities: ['section.manage', 'member.approve', 'member.remove', 'channel.create', 'channel.delete', 'message.pin', 'message.delete']
			},
			{
				id: 'admin',
				name: 'Admin',
				level: 4,
				description: 'Global administrator',
				capabilities: ['admin.global', 'section.create', 'section.delete', 'section.manage', 'member.approve', 'member.remove', 'channel.create', 'channel.delete', 'message.pin', 'message.delete', 'user.whitelist']
			}
		],
		cohorts: [
			{ id: 'admin', name: 'Administrators', description: 'Global system administrators' },
			{ id: 'approved', name: 'Approved Users', description: 'Manually approved by admin' },
			{ id: 'business', name: 'Business Partners', description: 'Business collaborators' },
			{ id: 'moomaa-tribe', name: 'Moomaa Tribe', description: 'Core community members' },
			{ id: 'fairfield-residents', name: 'Fairfield Residents', description: 'Local community members' }
		],
		sections: [
			{
				id: 'fairfield-guests',
				name: 'Fairfield Guests',
				description: 'Welcome area for visitors - open to all authenticated users',
				icon: '👋',
				order: 1,
				access: { requiresApproval: false, defaultRole: 'guest', autoApprove: true },
				features: {
					showStats: true,
					allowChannelCreation: false,
					calendar: { access: 'full', canCreate: false }
				},
				ui: { color: '#6366f1' }
			},
			{
				id: 'minimoonoir-rooms',
				name: 'MiniMooNoir',
				description: 'Core community chatrooms - request access to join',
				icon: '🌙',
				order: 2,
				access: { requiresApproval: true, defaultRole: 'member', autoApprove: false },
				features: {
					showStats: true,
					allowChannelCreation: true,
					calendar: { access: 'full', canCreate: true }
				},
				ui: { color: '#8b5cf6' }
			},
			{
				id: 'dreamlab',
				name: 'DreamLab',
				description: 'Creative and experimental projects - request access to join',
				icon: '💡',
				order: 3,
				access: { requiresApproval: true, defaultRole: 'member', autoApprove: false },
				features: {
					showStats: true,
					allowChannelCreation: true,
					calendar: { access: 'availability', canCreate: true, cohortRestricted: true }
				},
				ui: { color: '#ec4899' }
			}
		],
		calendarAccessLevels: [
			{
				id: 'full',
				name: 'Full Access',
				description: 'All details visible',
				canView: true,
				canViewDetails: true
			},
			{
				id: 'availability',
				name: 'Availability Only',
				description: 'Dates only',
				canView: true,
				canViewDetails: false
			},
			{
				id: 'cohort',
				name: 'Cohort Restricted',
				description: 'Cohort match required',
				canView: true,
				canViewDetails: 'cohort-match'
			},
			{
				id: 'none',
				name: 'No Access',
				description: 'Hidden',
				canView: false,
				canViewDetails: false
			}
		],
		channelVisibility: [
			{ id: 'public', name: 'Public', description: 'All section members' },
			{ id: 'cohort', name: 'Cohort Only', description: 'Assigned cohorts' },
			{ id: 'invite', name: 'Invite Only', description: 'Explicit invites' }
		]
	};
}

// Config accessor functions
const config = loadConfig();

export function getAppConfig() {
	return config.app;
}

export function getRoles(): RoleConfig[] {
	return config.roles;
}

export function getRole(roleId: RoleId): RoleConfig | undefined {
	return config.roles.find((r) => r.id === roleId);
}

export function getCohorts(): CohortConfig[] {
	return config.cohorts;
}

export function getCohort(cohortId: CohortId): CohortConfig | undefined {
	return config.cohorts.find((c) => c.id === cohortId);
}

export function getSections(): SectionConfig[] {
	return config.sections.sort((a, b) => a.order - b.order);
}

export function getSection(sectionId: SectionId): SectionConfig | undefined {
	return config.sections.find((s) => s.id === sectionId);
}

export function getDefaultSection(): SectionConfig {
	return getSection(config.app.defaultSection) || config.sections[0];
}

export function getSectionsByAccess(requiresApproval: boolean): SectionConfig[] {
	return config.sections.filter((s) => s.access.requiresApproval === requiresApproval);
}

export function getCalendarAccessLevel(level: CalendarAccessLevel) {
	return config.calendarAccessLevels.find((l) => l.id === level);
}

/**
 * Check if a role has a specific capability
 */
export function roleHasCapability(roleId: RoleId, capability: string): boolean {
	const role = getRole(roleId);
	if (!role) return false;

	// Admin has all capabilities
	if (role.id === 'admin') return true;

	return role.capabilities?.includes(capability) ?? false;
}

/**
 * Check if one role is higher than another
 */
export function roleIsHigherThan(roleA: RoleId, roleB: RoleId): boolean {
	const a = getRole(roleA);
	const b = getRole(roleB);
	if (!a || !b) return false;
	return a.level > b.level;
}

/**
 * Get the highest role from a list
 */
export function getHighestRole(roles: RoleId[]): RoleId {
	if (roles.length === 0) return 'guest';

	return roles.reduce((highest, current) => {
		return roleIsHigherThan(current, highest) ? current : highest;
	}, roles[0]);
}

// Superuser accessor
export function getSuperuser(): SuperuserConfig | undefined {
	return config.superuser;
}

export function isSuperuser(pubkey: string): boolean {
	return config.superuser?.pubkey === pubkey;
}

// Export typed section IDs for backward compatibility
export type { SectionId as ChannelSection } from './types';

/**
 * Legacy compatibility: SECTION_CONFIG object
 * Maps section ID to SectionConfig for existing code
 */
export function getSectionConfigMap(): Record<string, SectionConfig> {
	const map: Record<string, SectionConfig> = {};
	for (const section of config.sections) {
		map[section.id] = section;
	}
	return map;
}

export const SECTION_CONFIG = getSectionConfigMap();
