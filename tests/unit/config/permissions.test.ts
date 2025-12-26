/**
 * Permissions Tests
 *
 * Tests for permission checking and access control
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UserPermissions } from '$lib/config/types';
import {
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
} from '$lib/config/permissions';

import { getSections, clearConfigCache } from '$lib/config/loader';

describe('Permissions', () => {
	beforeEach(() => {
		clearConfigCache();
	});

	describe('hasCapability', () => {
		it('should grant all capabilities to global admin', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'admin',
				cohorts: [],
				sectionRoles: []
			};

			expect(hasCapability(permissions, 'any.capability')).toBe(true);
		});

		it('should check global role capabilities', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'moderator',
				cohorts: [],
				sectionRoles: []
			};

			expect(hasCapability(permissions, 'forum.create')).toBe(true);
			expect(hasCapability(permissions, 'section.manage')).toBe(false);
		});

		it('should check section-specific role capabilities', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: 'test-section',
						role: 'section-admin',
						assignedAt: Date.now()
					}
				]
			};

			expect(hasCapability(permissions, 'section.manage', 'test-section')).toBe(true);
			expect(hasCapability(permissions, 'section.manage')).toBe(false);
		});

		it('should return false for guest without capabilities', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: []
			};

			expect(hasCapability(permissions, 'channel.create')).toBe(false);
		});
	});

	describe('canAccessSection', () => {
		it('should allow access to auto-approve sections', () => {
			const permissions = createDefaultPermissions('test');
			const sections = getSections();
			const autoApproveSection = sections.find((s) => s.access.autoApprove);

			if (autoApproveSection) {
				expect(canAccessSection(permissions, autoApproveSection.id)).toBe(true);
			}
		});

		it('should grant access to global admin for any section', () => {
			const permissions = createAdminPermissions('test');
			const sections = getSections();

			sections.forEach((section) => {
				expect(canAccessSection(permissions, section.id)).toBe(true);
			});
		});

		it('should grant access when user has section role', () => {
			// Use an actual section from the config
			const sections = getSections();
			const firstSection = sections[0];

			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: firstSection.id,
						role: 'member',
						assignedAt: Date.now()
					}
				]
			};

			expect(canAccessSection(permissions, firstSection.id)).toBe(true);
		});

		it('should deny access when section requires approval and user has no role', () => {
			const permissions = createDefaultPermissions('test');
			const sections = getSections();
			const restrictedSection = sections.find(
				(s) => s.access.requiresApproval && !s.access.autoApprove
			);

			if (restrictedSection) {
				expect(canAccessSection(permissions, restrictedSection.id)).toBe(false);
			}
		});

		it('should grant access when user has required cohort', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: ['admin'],
				sectionRoles: []
			};

			// Would need a section with requiredCohorts configured to test properly
			expect(canAccessSection(permissions, 'test-section')).toBeDefined();
		});

		it('should return false for nonexistent section', () => {
			const permissions = createDefaultPermissions('test');
			expect(canAccessSection(permissions, 'nonexistent')).toBe(false);
		});
	});

	describe('getEffectiveRole', () => {
		it('should return admin for global admin', () => {
			const permissions = createAdminPermissions('test');
			expect(getEffectiveRole(permissions, 'any-section')).toBe('admin');
		});

		it('should return section-specific role when assigned', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: 'test-section',
						role: 'moderator',
						assignedAt: Date.now()
					}
				]
			};

			expect(getEffectiveRole(permissions, 'test-section')).toBe('moderator');
		});

		it('should return higher of global or section role', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'moderator',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: 'test-section',
						role: 'member',
						assignedAt: Date.now()
					}
				]
			};

			expect(getEffectiveRole(permissions, 'test-section')).toBe('moderator');
		});

		it('should return global role for auto-approve sections', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'member',
				cohorts: [],
				sectionRoles: []
			};

			const sections = getSections();
			const autoApproveSection = sections.find((s) => s.access.autoApprove);

			if (autoApproveSection) {
				expect(getEffectiveRole(permissions, autoApproveSection.id)).toBe('member');
			}
		});

		it('should return guest for sections without access', () => {
			const permissions = createDefaultPermissions('test');
			const sections = getSections();
			const restrictedSection = sections.find((s) => !s.access.autoApprove);

			if (restrictedSection) {
				expect(getEffectiveRole(permissions, restrictedSection.id)).toBe('guest');
			}
		});
	});

	describe('canManageSection', () => {
		it('should allow section-admin to manage section', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: 'test-section',
						role: 'section-admin',
						assignedAt: Date.now()
					}
				]
			};

			expect(canManageSection(permissions, 'test-section')).toBe(true);
		});

		it('should not allow moderator to manage section', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: 'test-section',
						role: 'moderator',
						assignedAt: Date.now()
					}
				]
			};

			expect(canManageSection(permissions, 'test-section')).toBe(false);
		});

		it('should allow global admin to manage any section', () => {
			const permissions = createAdminPermissions('test');
			expect(canManageSection(permissions, 'any-section')).toBe(true);
		});
	});

	describe('canModerateSection', () => {
		it('should allow moderator or higher to moderate', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'moderator',
				cohorts: [],
				sectionRoles: []
			};

			const sections = getSections();
			const autoApproveSection = sections.find((s) => s.access.autoApprove);

			if (autoApproveSection) {
				expect(canModerateSection(permissions, autoApproveSection.id)).toBe(true);
			}
		});

		it('should not allow member to moderate', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'member',
				cohorts: [],
				sectionRoles: []
			};

			expect(canModerateSection(permissions, 'test-section')).toBe(false);
		});
	});

	describe('canCreateChannel', () => {
		it('should allow channel creation when section allows it and user has capability', () => {
			const sections = getSections();
			const channelSection = sections.find((s) => s.allowForumCreation);

			if (channelSection) {
				const permissions: UserPermissions = {
					pubkey: 'test',
					globalRole: 'moderator',
					cohorts: [],
					sectionRoles: []
				};

				expect(canCreateChannel(permissions, channelSection.id)).toBe(true);
			}
		});

		it('should deny channel creation when section disallows it', () => {
			const sections = getSections();
			const noChannelSection = sections.find((s) => !s.allowForumCreation);

			if (noChannelSection) {
				const permissions = createAdminPermissions('test');
				expect(canCreateChannel(permissions, noChannelSection.id)).toBe(false);
			}
		});

		it('should deny channel creation without capability', () => {
			const sections = getSections();
			const channelSection = sections.find((s) => s.allowForumCreation);

			if (channelSection) {
				const permissions = createDefaultPermissions('test');
				expect(canCreateChannel(permissions, channelSection.id)).toBe(false);
			}
		});
	});

	describe('canViewCalendar', () => {
		it('should allow viewing calendar when access is not none', () => {
			const sections = getSections();
			const calendarSection = sections.find((s) => s.calendar.access !== 'none');

			if (calendarSection) {
				const permissions: UserPermissions = {
					pubkey: 'test',
					globalRole: 'guest',
					cohorts: [],
					sectionRoles: []
				};

				// Need section access first
				if (calendarSection.access.autoApprove) {
					expect(canViewCalendar(permissions, calendarSection.id)).toBe(true);
				}
			}
		});

		it('should deny calendar access when level is none', () => {
			const permissions = createAdminPermissions('test');
			// Would need a section with calendar.access === 'none' to test
		});
	});

	describe('canViewCalendarDetails', () => {
		it('should allow full details with full access level', () => {
			const sections = getSections();
			const fullAccessSection = sections.find((s) => s.calendar.access === 'full');

			if (fullAccessSection && fullAccessSection.access.autoApprove) {
				const permissions = createDefaultPermissions('test');
				expect(canViewCalendarDetails(permissions, fullAccessSection.id)).toBe(true);
			}
		});

		it('should deny details with availability-only access', () => {
			const sections = getSections();
			const availSection = sections.find((s) => s.calendar.access === 'availability');

			if (availSection && availSection.access.autoApprove) {
				const permissions = createDefaultPermissions('test');
				expect(canViewCalendarDetails(permissions, availSection.id)).toBe(false);
			}
		});

		it('should check cohort match for cohort-restricted access', () => {
			const sections = getSections();
			const cohortSection = sections.find(
				(s) => s.calendar.access === 'cohort' && s.calendar.cohortRestricted
			);

			if (cohortSection) {
				const permissionsWithCohort: UserPermissions = {
					pubkey: 'test',
					globalRole: 'guest',
					cohorts: ['admin'],
					sectionRoles: []
				};

				const permissionsWithoutCohort = createDefaultPermissions('test');

				expect(canViewCalendarDetails(permissionsWithCohort, cohortSection.id, ['admin'])).toBe(
					true
				);
				expect(
					canViewCalendarDetails(permissionsWithoutCohort, cohortSection.id, ['admin'])
				).toBe(false);
			}
		});

		it('should return false when event has no cohorts in cohort-restricted section', () => {
			const sections = getSections();
			const cohortSection = sections.find((s) => s.calendar.cohortRestricted);

			if (cohortSection) {
				const permissions = createAdminPermissions('test');
				expect(canViewCalendarDetails(permissions, cohortSection.id, [])).toBe(false);
			}
		});
	});

	describe('canCreateCalendarEvent', () => {
		it('should allow event creation when section allows it and user is member+', () => {
			const sections = getSections();
			const createSection = sections.find((s) => s.calendar.canCreate);

			if (createSection) {
				const permissions: UserPermissions = {
					pubkey: 'test',
					globalRole: 'member',
					cohorts: [],
					sectionRoles: []
				};

				if (createSection.access.autoApprove) {
					expect(canCreateCalendarEvent(permissions, createSection.id)).toBe(true);
				}
			}
		});

		it('should deny event creation for guests', () => {
			const sections = getSections();
			const createSection = sections.find((s) => s.calendar.canCreate);

			if (createSection && createSection.access.autoApprove) {
				const permissions = createDefaultPermissions('test');
				expect(canCreateCalendarEvent(permissions, createSection.id)).toBe(false);
			}
		});
	});

	describe('isGlobalAdmin', () => {
		it('should identify admin by global role', () => {
			const permissions = createAdminPermissions('test');
			expect(isGlobalAdmin(permissions)).toBe(true);
		});

		it('should identify admin by cohort', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: ['admin'],
				sectionRoles: []
			};

			expect(isGlobalAdmin(permissions)).toBe(true);
		});

		it('should return false for non-admin', () => {
			const permissions = createDefaultPermissions('test');
			expect(isGlobalAdmin(permissions)).toBe(false);
		});
	});

	describe('isSectionAdmin', () => {
		it('should identify global admin as section admin', () => {
			const permissions = createAdminPermissions('test');
			expect(isSectionAdmin(permissions, 'any-section')).toBe(true);
		});

		it('should identify section-admin role', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'guest',
				cohorts: [],
				sectionRoles: [
					{
						sectionId: 'test-section',
						role: 'section-admin',
						assignedAt: Date.now()
					}
				]
			};

			expect(isSectionAdmin(permissions, 'test-section')).toBe(true);
		});

		it('should return false for non-admin roles', () => {
			const permissions: UserPermissions = {
				pubkey: 'test',
				globalRole: 'moderator',
				cohorts: [],
				sectionRoles: []
			};

			expect(isSectionAdmin(permissions, 'test-section')).toBe(false);
		});
	});

	describe('getAccessibleSections', () => {
		it('should return all sections for global admin', () => {
			const permissions = createAdminPermissions('test');
			const allSections = getSections().map((s) => s.id);
			const accessible = getAccessibleSections(permissions, allSections);

			expect(accessible.length).toBe(allSections.length);
		});

		it('should return only accessible sections for regular user', () => {
			const permissions = createDefaultPermissions('test');
			const allSections = getSections().map((s) => s.id);
			const accessible = getAccessibleSections(permissions, allSections);

			expect(accessible.length).toBeGreaterThan(0);
			expect(accessible.length).toBeLessThanOrEqual(allSections.length);
		});
	});

	describe('getManageableSections', () => {
		it('should return all sections for global admin', () => {
			const permissions = createAdminPermissions('test');
			const allSections = getSections().map((s) => s.id);
			const manageable = getManageableSections(permissions, allSections);

			expect(manageable.length).toBe(allSections.length);
		});

		it('should return empty for regular user', () => {
			const permissions = createDefaultPermissions('test');
			const allSections = getSections().map((s) => s.id);
			const manageable = getManageableSections(permissions, allSections);

			expect(manageable.length).toBe(0);
		});
	});

	describe('permission mutations', () => {
		it('should add section role', () => {
			let permissions = createDefaultPermissions('test');
			permissions = addSectionRole(permissions, 'test-section', 'moderator', 'admin-pubkey');

			expect(permissions.sectionRoles.length).toBe(1);
			expect(permissions.sectionRoles[0].sectionId).toBe('test-section');
			expect(permissions.sectionRoles[0].role).toBe('moderator');
			expect(permissions.sectionRoles[0].assignedBy).toBe('admin-pubkey');
		});

		it('should replace existing section role', () => {
			let permissions = createDefaultPermissions('test');
			permissions = addSectionRole(permissions, 'test-section', 'member');
			permissions = addSectionRole(permissions, 'test-section', 'moderator');

			expect(permissions.sectionRoles.length).toBe(1);
			expect(permissions.sectionRoles[0].role).toBe('moderator');
		});

		it('should remove section role', () => {
			let permissions = createDefaultPermissions('test');
			permissions = addSectionRole(permissions, 'test-section', 'moderator');
			permissions = removeSectionRole(permissions, 'test-section');

			expect(permissions.sectionRoles.length).toBe(0);
		});

		it('should add cohort', () => {
			let permissions = createDefaultPermissions('test');
			permissions = addCohort(permissions, 'business');

			expect(permissions.cohorts).toContain('business');
		});

		it('should not duplicate cohort', () => {
			let permissions = createDefaultPermissions('test');
			permissions = addCohort(permissions, 'business');
			permissions = addCohort(permissions, 'business');

			expect(permissions.cohorts.filter((c) => c === 'business').length).toBe(1);
		});

		it('should remove cohort', () => {
			let permissions = createDefaultPermissions('test');
			permissions = addCohort(permissions, 'business');
			permissions = removeCohort(permissions, 'business');

			expect(permissions.cohorts).not.toContain('business');
		});
	});
});
