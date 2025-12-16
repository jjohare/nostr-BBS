<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { authStore } from '$lib/stores/auth';
  import { isAdminVerified, whitelistStatusStore } from '$lib/stores/user';
  import { verifyWhitelistStatus } from '$lib/nostr/whitelist';
  import { setSigner, connectNDK, getRelayUrls, reconnectNDK } from '$lib/nostr/ndk';
  import { createChannel, fetchChannels, type CreatedChannel } from '$lib/nostr/channels';
  import { settingsStore } from '$lib/stores/settings';
  import { SECTION_CONFIG, type ChannelSection, type SectionAccessRequest } from '$lib/types/channel';
  import { sectionStore, pendingRequestCount } from '$lib/stores/sections';
  import { subscribeAccessRequests, approveSectionAccess } from '$lib/nostr/sections';
  import type { NDKSubscription } from '@nostr-dev-kit/ndk';
  import UserDisplay from '$lib/components/user/UserDisplay.svelte';

  // Active view for admin tabs
  type AdminView = 'dashboard' | 'users' | 'requests' | 'settings';
  let activeView: AdminView = 'dashboard';

  // Pending section access requests
  let pendingRequests: SectionAccessRequest[] = [];
  let requestSubscription: NDKSubscription | null = null;

  let stats = {
    totalUsers: 0,
    totalChannels: 0,
    totalMessages: 0,
    pendingApprovals: 0
  };

  // Reactive update of pending approvals count
  $: stats.pendingApprovals = pendingRequests.length;

  let channels: CreatedChannel[] = [];
  let isLoading = false;
  let error: string | null = null;
  let showCreateForm = false;
  let relayStatus = 'disconnected';

  // Form fields
  let formName = '';
  let formDescription = '';
  let formVisibility: 'public' | 'cohort' | 'private' = 'public';
  let formCohorts = '';
  let formEncrypted = false;
  let formSection: ChannelSection = 'fairfield-guests';

  // Relay settings
  let isPrivateMode = $settingsStore.relayMode === 'private';
  let isSwitchingMode = false;

  async function handleRelayModeChange() {
    isSwitchingMode = true;
    const newMode = isPrivateMode ? 'private' : 'federated';
    settingsStore.setRelayMode(newMode);

    try {
      await reconnectNDK();
      relayStatus = 'connected';
    } catch (e) {
      console.error('Failed to reconnect:', e);
      relayStatus = 'error';
    } finally {
      isSwitchingMode = false;
    }
  }

  async function initializeAdmin() {
    if (!$authStore.privateKey) {
      error = 'Please login first to access admin features';
      return;
    }

    try {
      isLoading = true;
      error = null;

      // Set up signer with user's private key
      setSigner($authStore.privateKey);

      // Connect to relays
      await connectNDK();
      relayStatus = 'connected';

      // Fetch existing channels
      channels = await fetchChannels();
      stats.totalChannels = channels.length;

      // Fetch pending section access requests
      await loadPendingRequests();

      // Subscribe to new incoming requests
      requestSubscription = subscribeAccessRequests((request) => {
        // Add to pending list if not already present
        if (!pendingRequests.find(r => r.id === request.id)) {
          pendingRequests = [request, ...pendingRequests];
        }
      });

    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to initialize admin';
      relayStatus = 'error';
    } finally {
      isLoading = false;
    }
  }

  async function loadPendingRequests() {
    try {
      const { fetchPendingRequests } = await import('$lib/nostr/sections');
      pendingRequests = await fetchPendingRequests();
    } catch (e) {
      console.error('Failed to load pending requests:', e);
    }
  }

  async function handleApproveRequest(request: SectionAccessRequest) {
    try {
      isLoading = true;
      const result = await approveSectionAccess(request);
      if (result.success) {
        // Remove from pending list
        pendingRequests = pendingRequests.filter(r => r.id !== request.id);
      } else {
        error = result.error || 'Failed to approve request';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to approve request';
    } finally {
      isLoading = false;
    }
  }

  async function handleDenyRequest(request: SectionAccessRequest) {
    try {
      isLoading = true;
      await sectionStore.denyRequest(request, 'Access denied by admin');
      pendingRequests = pendingRequests.filter(r => r.id !== request.id);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to deny request';
    } finally {
      isLoading = false;
    }
  }

  function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  async function handleCreateChannel() {
    if (!formName.trim()) {
      error = 'Channel name is required';
      return;
    }

    try {
      isLoading = true;
      error = null;

      const cohorts = formCohorts.split(',').map(c => c.trim()).filter(Boolean);

      const newChannel = await createChannel({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        visibility: formVisibility,
        cohorts,
        encrypted: formEncrypted,
        section: formSection,
      });

      channels = [newChannel, ...channels];
      stats.totalChannels = channels.length;

      // Reset form
      formName = '';
      formDescription = '';
      formVisibility = 'public';
      formCohorts = '';
      formEncrypted = false;
      formSection = 'fairfield-guests';
      showCreateForm = false;

    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create channel';
    } finally {
      isLoading = false;
    }
  }

  function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString();
  }

  function getVisibilityBadge(visibility: string): string {
    const badges: Record<string, string> = {
      public: 'badge-success',
      cohort: 'badge-warning',
      private: 'badge-error',
    };
    return badges[visibility] || 'badge-ghost';
  }

  onMount(async () => {
    // Wait for auth store to be ready before checking authentication
    await authStore.waitForReady();

    if (!$authStore.publicKey) {
      goto(`${base}/chat`);
      return;
    }

    // Verify admin status via relay (server-side source of truth)
    try {
      isLoading = true;
      const status = await verifyWhitelistStatus($authStore.publicKey);
      whitelistStatusStore.set(status);

      if (!status.isAdmin) {
        error = 'Access denied: Admin privileges required';
        setTimeout(() => goto(`${base}/chat`), 2000);
        return;
      }

      initializeAdmin();
    } catch (e) {
      error = 'Failed to verify admin status';
      setTimeout(() => goto(`${base}/chat`), 2000);
    }
  });

  onDestroy(() => {
    // Clean up subscription when leaving admin page
    if (requestSubscription) {
      requestSubscription.stop();
      requestSubscription = null;
    }
  });
</script>

<svelte:head>
  <title>Admin Dashboard - Minimoonoir</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl">
  <div class="mb-6">
    <h1 class="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
    <p class="text-base-content/70">System overview and management</p>
    <div class="mt-2 flex items-center gap-2">
      <span class="badge {relayStatus === 'connected' ? 'badge-success' : relayStatus === 'error' ? 'badge-error' : 'badge-warning'}">
        {relayStatus}
      </span>
      <span class="text-sm text-base-content/50">Relay Status</span>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
      <button class="btn btn-ghost btn-sm" on:click={() => error = null}>Dismiss</button>
    </div>
  {/if}

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    <div class="card bg-base-200">
      <div class="card-body items-center text-center">
        <div class="stat-value text-primary">{stats.totalUsers}</div>
        <div class="text-sm text-base-content/70 uppercase tracking-wide">Total Users</div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body items-center text-center">
        <div class="stat-value text-primary">{stats.totalChannels}</div>
        <div class="text-sm text-base-content/70 uppercase tracking-wide">Total Channels</div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body items-center text-center">
        <div class="stat-value text-primary">{stats.totalMessages}</div>
        <div class="text-sm text-base-content/70 uppercase tracking-wide">Total Messages</div>
      </div>
    </div>

    <div class="card bg-warning/20 border border-warning">
      <div class="card-body items-center text-center">
        <div class="stat-value text-warning">{stats.pendingApprovals}</div>
        <div class="text-sm text-base-content/70 uppercase tracking-wide">Pending Approvals</div>
      </div>
    </div>
  </div>

  <!-- Relay Settings Section -->
  <div class="card bg-base-200 mb-6">
    <div class="card-body">
      <h2 class="card-title">Relay Settings</h2>
      <p class="text-sm text-base-content/70 mb-4">
        Control whether the app connects only to your private relay or federates with the wider Nostr network.
      </p>

      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-lg"
            bind:checked={isPrivateMode}
            on:change={handleRelayModeChange}
            disabled={isSwitchingMode}
          />
          <div>
            <span class="label-text font-semibold text-lg">
              {isPrivateMode ? 'Private Mode' : 'Federated Mode'}
            </span>
            <p class="text-sm text-base-content/60">
              {#if isPrivateMode}
                Only connected to local relay. Messages stay private.
              {:else}
                Connected to public Nostr relays. Messages are federated.
              {/if}
            </p>
          </div>
          {#if isSwitchingMode}
            <span class="loading loading-spinner loading-sm ml-2"></span>
          {/if}
        </label>
      </div>

      <div class="mt-4 p-3 bg-base-300 rounded-lg">
        <div class="text-sm font-medium mb-2">Active Relays:</div>
        <div class="flex flex-wrap gap-2">
          {#each getRelayUrls() as relay}
            <span class="badge badge-outline">{relay}</span>
          {/each}
        </div>
      </div>

      {#if !isPrivateMode}
        <div class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Federated mode connects to public relays. Messages will be visible on the wider Nostr network.</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Channel Management Section -->
  <div class="card bg-base-200 mb-6">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <h2 class="card-title">Channel Management</h2>
        <button
          class="btn btn-primary gap-2"
          on:click={() => showCreateForm = !showCreateForm}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Channel
        </button>
      </div>

      <!-- Create Channel Form -->
      {#if showCreateForm}
        <div class="mt-4 p-4 bg-base-300 rounded-lg">
          <h3 class="font-semibold mb-4">New Channel</h3>

          <div class="form-control mb-3">
            <label class="label">
              <span class="label-text">Channel Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter channel name"
              class="input input-bordered"
              bind:value={formName}
            />
          </div>

          <div class="form-control mb-3">
            <label class="label">
              <span class="label-text">Description</span>
            </label>
            <textarea
              class="textarea textarea-bordered"
              placeholder="Channel description (optional)"
              rows="2"
              bind:value={formDescription}
            ></textarea>
          </div>

          <div class="form-control mb-3">
            <label class="label">
              <span class="label-text">Section (Area)</span>
            </label>
            <select class="select select-bordered" bind:value={formSection}>
              {#each Object.entries(SECTION_CONFIG) as [key, config]}
                <option value={key}>{config.icon} {config.name}</option>
              {/each}
            </select>
            <label class="label">
              <span class="label-text-alt text-base-content/60">
                {SECTION_CONFIG[formSection]?.description || ''}
              </span>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Visibility</span>
              </label>
              <select class="select select-bordered" bind:value={formVisibility}>
                <option value="public">Public</option>
                <option value="cohort">Cohort Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Cohorts (comma-separated)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 2024, 2025"
                class="input input-bordered"
                bind:value={formCohorts}
              />
            </div>
          </div>

          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                class="toggle toggle-primary"
                bind:checked={formEncrypted}
              />
              <span class="label-text">Encrypted Messages</span>
            </label>
          </div>

          <div class="flex justify-end gap-2">
            <button class="btn btn-ghost" on:click={() => showCreateForm = false}>
              Cancel
            </button>
            <button
              class="btn btn-primary"
              on:click={handleCreateChannel}
              disabled={isLoading || !formName.trim()}
            >
              {#if isLoading}
                <span class="loading loading-spinner loading-sm"></span>
              {/if}
              Create Channel
            </button>
          </div>
        </div>
      {/if}

      <!-- Channels List -->
      <div class="mt-4">
        {#if isLoading && channels.length === 0}
          <div class="text-center py-8">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="mt-2 text-base-content/70">Loading channels...</p>
          </div>
        {:else if channels.length === 0}
          <div class="text-center py-8 text-base-content/50">
            <p>No channels yet. Create your first channel above.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each channels as channel (channel.id)}
              <div class="card bg-base-300">
                <div class="card-body p-4">
                  <h3 class="font-semibold">{channel.name}</h3>
                  {#if channel.description}
                    <p class="text-sm text-base-content/70 line-clamp-2">{channel.description}</p>
                  {/if}
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span class="badge badge-neutral badge-sm" title="Section">
                      {SECTION_CONFIG[channel.section]?.icon || '👋'} {SECTION_CONFIG[channel.section]?.name || 'Guest Area'}
                    </span>
                    <span class="badge {getVisibilityBadge(channel.visibility)} badge-sm">
                      {channel.visibility}
                    </span>
                    {#if channel.encrypted}
                      <span class="badge badge-info badge-sm">Encrypted</span>
                    {/if}
                    {#each channel.cohorts as cohort}
                      <span class="badge badge-outline badge-sm">{cohort}</span>
                    {/each}
                  </div>
                  <div class="text-xs text-base-content/50 mt-2">
                    Created {formatTimestamp(channel.createdAt)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Pending Section Access Requests -->
  <div class="card bg-base-200 mb-6">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <h2 class="card-title">
          Pending Access Requests
          {#if pendingRequests.length > 0}
            <span class="badge badge-warning">{pendingRequests.length}</span>
          {/if}
        </h2>
        <button
          class="btn btn-ghost btn-sm"
          on:click={loadPendingRequests}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {#if isLoading && pendingRequests.length === 0}
        <div class="text-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-2 text-base-content/70">Loading pending requests...</p>
        </div>
      {:else if pendingRequests.length === 0}
        <div class="text-center py-8 text-base-content/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No pending access requests</p>
          <p class="text-sm mt-1">New users requesting section access will appear here</p>
        </div>
      {:else}
        <div class="overflow-x-auto mt-4">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>User</th>
                <th>Section</th>
                <th>Message</th>
                <th>Requested</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each pendingRequests as request (request.id)}
                <tr>
                  <td>
                    <UserDisplay
                      pubkey={request.requesterPubkey}
                      showAvatar={true}
                      showName={true}
                      avatarSize="sm"
                      clickable={false}
                    />
                  </td>
                  <td>
                    <span class="badge badge-primary">
                      {SECTION_CONFIG[request.section]?.icon || ''} {SECTION_CONFIG[request.section]?.name || request.section}
                    </span>
                  </td>
                  <td>
                    {#if request.message}
                      <span class="text-sm text-base-content/70 line-clamp-2">{request.message}</span>
                    {:else}
                      <span class="text-xs text-base-content/50">No message</span>
                    {/if}
                  </td>
                  <td>
                    <span class="text-sm">{formatRelativeTime(request.requestedAt)}</span>
                  </td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button
                        class="btn btn-success btn-sm"
                        on:click={() => handleApproveRequest(request)}
                        disabled={isLoading}
                      >
                        Approve
                      </button>
                      <button
                        class="btn btn-error btn-sm btn-outline"
                        on:click={() => handleDenyRequest(request)}
                        disabled={isLoading}
                      >
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <a href="{base}/admin/stats" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
      <div class="card-body">
        <h2 class="card-title">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Statistics
        </h2>
        <p class="text-sm text-base-content/70">View detailed system analytics and reports</p>
      </div>
    </a>

    <a href="{base}/admin/calendar" class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
      <div class="card-body">
        <h2 class="card-title">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendar Events
        </h2>
        <p class="text-sm text-base-content/70">Manage NIP-52 calendar events and scheduling</p>
      </div>
    </a>

    <div class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          System Settings
        </h2>
        <p class="text-sm text-base-content/70">Configure relay settings, cohorts, and policies</p>
        <div class="text-xs text-base-content/40 mt-2">Coming soon</div>
      </div>
    </div>
  </div>
</div>
