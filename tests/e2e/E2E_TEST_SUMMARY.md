# Fairfield Nostr E2E Test Suite

Comprehensive Playwright end-to-end tests for the Fairfield Nostr application covering authentication, section access control, calendar visibility, and admin workflows.

## Test Files

### 1. `auth.spec.ts` - Authentication Flows
Tests both admin and regular user authentication:

**Admin Authentication:**
- Login with credentials from `.env` (VITE_ADMIN_PUBKEY)
- Redirect to admin dashboard after login
- Admin privileges verification
- Session persistence across page reloads
- Logout functionality

**Regular User Authentication:**
- Signup and account creation
- Mnemonic generation and validation
- Redirect to pending approval after signup
- Login with valid/invalid mnemonics
- Session persistence
- Multiple user accounts
- Mnemonic normalization (whitespace, case)

**Edge Cases:**
- Empty mnemonic validation
- Too short mnemonic error handling
- Loading states during authentication
- Unauthenticated user redirects

**Test Count:** ~20 tests

### 2. `sections.spec.ts` - Section Access Workflows
Tests the section (area) access control system:

**Section Preview:**
- Unauthenticated users can see section cards
- Section statistics visibility
- Approval status badges

**Fairfield Guests (Auto-Approved):**
- Immediate access for new users
- No approval required
- Public channel visibility

**MiniMooNoir (Requires Approval):**
- Request access workflow
- Pending status tracking
- Cannot request multiple times
- Access after approval
- Public channel visibility after approval

**DreamLab (Requires Approval):**
- Request access with optional message
- Pending status tracking
- Access after approval

**Multi-Section Access:**
- Request access to multiple sections
- Independent approval per section
- Approval persistence across sessions

**Test Count:** ~20 tests

### 3. `calendar.spec.ts` - Calendar Access Control
Tests calendar visibility based on section membership:

**Fairfield Guests:**
- Full calendar access
- Can see all event details (title, description, location)
- No masking or restrictions

**MiniMooNoir Members:**
- Full calendar access after approval
- Can see all event details
- Same access level as Fairfield Guests

**DreamLab Members (Availability Only):**
- Can view calendar but with limited details
- See availability (dates booked) but NOT event details
- Cannot see locations or descriptions
- Event details are masked

**DreamLab with Cohort Match:**
- Can see event details for cohort-tagged events
- See only availability for non-matching cohorts
- Cohort-based access control

**Edge Cases:**
- Unauthenticated users redirected
- Multiple section approvals (highest access level wins)
- Calendar button visibility on section cards

**Test Count:** ~15 tests

### 4. `admin.spec.ts` - Admin Workflows
Tests admin-specific functionality:

**Admin Dashboard:**
- Access control (admin only)
- System statistics display
- Quick action buttons

**Create Chatrooms:**
- Create channels in Fairfield Guests section
- Create channels in MiniMooNoir section
- Create channels in DreamLab section
- Validation (name required)
- Channels appear in list after creation

**Pending Access Requests:**
- View pending requests
- Approve access requests
- Approved requests removed from pending list
- Requester information visibility
- Handle multiple pending requests

**Calendar Management:**
- Access calendar management interface
- View all calendar events
- Full event details (no masking)

**Section Management:**
- View section statistics
- Accurate channel counts
- Navigate between sections

**Permissions:**
- Admin pubkey matches VITE_ADMIN_PUBKEY
- Non-admin cannot perform admin actions
- Privileges persist after logout/login

**Test Count:** ~23 tests

## Test Helpers

### `fixtures/test-helpers.ts`
Common utilities for E2E tests:

**Authentication:**
- `loginAsAdmin(page)` - Login with admin credentials from .env
- `loginAsUser(page, mnemonic?)` - Login as regular user
- `signupNewUser(page)` - Create new account via signup flow
- `logout(page)` - Logout current user

**Section Management:**
- `navigateToSection(page, section)` - Navigate to specific section
- `requestSectionAccess(page, section, message?)` - Request access to section
- `approvePendingRequest(page, userPubkey)` - Approve access request (admin)

**Admin Actions:**
- `createChatroom(page, name, section, description?)` - Create chatroom

**Calendar:**
- `navigateToCalendar(page)` - Navigate to calendar page
- `canSeeEventDetails(page, eventTitle)` - Check if event details visible
- `showsOnlyAvailability(page)` - Check if calendar shows masked view

**Utilities:**
- `getCurrentUserPubkey(page)` - Get current user's pubkey from localStorage
- `waitForNostrConnection(page, timeout)` - Wait for Nostr connection
- `generateTestMnemonic()` - Generate valid test mnemonic

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npx playwright test auth.spec.ts
npx playwright test sections.spec.ts
npx playwright test calendar.spec.ts
npx playwright test admin.spec.ts
```

### Specific Browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

## Test Environment

### Configuration
Tests use the existing `playwright.config.ts`:
- Base URL: `http://localhost:5173` (Vite dev server)
- Test directory: `./tests/e2e`
- Timeout: 60 seconds per test
- Retries: 2 on CI, 0 locally
- Workers: 1 on CI, parallel locally

### Environment Variables
Tests read from `.env`:
- `VITE_ADMIN_PUBKEY` - Admin public key for admin tests
- `ADMIN_KEY` - Admin mnemonic for admin login

### Web Server
Playwright automatically starts the Vite dev server before running tests:
```bash
npm run dev
```

## Test Coverage Summary

**Total Tests:** 78+ comprehensive E2E tests across 4 test suites

### User Journeys Covered

✅ **Admin Journey:**
1. Login as admin with credentials from .env
2. Create chatrooms in each section (Fairfield Guests, MiniMooNoir, DreamLab)
3. View pending access requests
4. Approve user access requests
5. View and manage calendar events

✅ **Regular User Journey:**
1. Register/login as regular user
2. View section previews and stats
3. Request access to MiniMooNoir section
4. Request access to DreamLab section
5. After approval, join public channels
6. View calendar (check masking works)

✅ **Calendar Access Tests:**
1. Fairfield Guests: Can see all calendar details
2. MiniMooNoir members: Can see all calendar details
3. DreamLab members: Can only see availability, not details
4. DreamLab with cohort match: Can see event details for their cohort

## File Structure

```
tests/e2e/
├── auth.spec.ts           # Authentication flows (20 tests)
├── sections.spec.ts       # Section access workflows (20 tests)
├── calendar.spec.ts       # Calendar visibility tests (15 tests)
├── admin.spec.ts          # Admin workflows (23 tests)
├── fixtures/
│   ├── test-helpers.ts    # Common test utilities
│   └── mock-relay.ts      # Mock Nostr relay (existing)
└── E2E_TEST_SUMMARY.md    # This file
```

## Test Quality Standards

All tests follow these principles:
- ✅ **Isolation**: Each test clears localStorage before running
- ✅ **Wait Strategies**: Proper waits for async Nostr operations
- ✅ **Accessibility**: Prefer role-based selectors
- ✅ **Multi-User**: Use context.newPage() for multi-user scenarios
- ✅ **Cleanup**: Close additional pages after use
- ✅ **Real Data**: Tests use actual database queries, not mocks

## Debugging

### View Test Results
```bash
npx playwright show-report
```

### Failed Tests
1. Check screenshots in `test-results/`
2. Review videos for failed tests
3. Enable trace: `npx playwright test --trace on`
4. View trace: `npx playwright show-trace trace.zip`

### Common Issues
- **Timeout**: Increase timeout in test or config
- **Selector not found**: Check UI implementation matches test selectors
- **Relay connection**: Ensure relay is accessible
- **Environment variables**: Verify `.env` file is present

## Next Steps

To run the tests:
```bash
# Install dependencies (if not already done)
npm install

# Run all E2E tests
npm run test:e2e

# Run in UI mode for debugging
npm run test:e2e:ui
```

## Test Maintenance

When updating the application:
1. Update test selectors if UI changes
2. Add new tests for new features
3. Adjust wait times if Nostr operations change
4. Keep test helpers in sync with application changes
