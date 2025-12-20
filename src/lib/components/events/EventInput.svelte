<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { EventMetadata, RecurrencePattern } from '$lib/types/channel';

  export let isEvent = false;
  export let startDate = '';
  export let startTime = '';
  export let endDate = '';
  export let endTime = '';
  export let location = '';
  export let recurrence: RecurrencePattern = 'none';
  export let recurrenceEnd = '';
  export let compact = false;

  const dispatch = createEventDispatcher<{
    change: EventMetadata | null;
    toggle: boolean;
  }>();

  $: if (isEvent) {
    emitChange();
  } else {
    dispatch('change', null);
  }

  function emitChange() {
    if (!startDate) return;

    const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
    const endDateTime = endDate
      ? new Date(`${endDate}T${endTime || '23:59'}`)
      : new Date(startDateTime.getTime() + 3600000); // Default 1 hour

    const eventData: EventMetadata = {
      isEvent: true,
      startDate: Math.floor(startDateTime.getTime() / 1000),
      endDate: Math.floor(endDateTime.getTime() / 1000),
      location: location || undefined,
      recurrence,
      recurrenceEnd: recurrenceEnd
        ? Math.floor(new Date(recurrenceEnd).getTime() / 1000)
        : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    dispatch('change', eventData);
  }

  function handleToggle() {
    isEvent = !isEvent;
    dispatch('toggle', isEvent);
    if (!isEvent) {
      // Reset fields
      startDate = '';
      startTime = '';
      endDate = '';
      endTime = '';
      location = '';
      recurrence = 'none';
      recurrenceEnd = '';
    }
  }

  const recurrenceOptions: { value: RecurrencePattern; label: string }[] = [
    { value: 'none', label: 'No repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  // Set minimum date to today
  $: minDate = new Date().toISOString().split('T')[0];
</script>

<div class="event-input" class:compact>
  <!-- Event Toggle -->
  <label class="label cursor-pointer justify-start gap-3 py-2">
    <input
      type="checkbox"
      class="toggle toggle-primary toggle-sm"
      checked={isEvent}
      on:change={handleToggle}
    />
    <span class="label-text font-medium">
      {#if isEvent}
        This is an event
      {:else}
        Mark as event
      {/if}
    </span>
  </label>

  {#if isEvent}
    <div class="event-fields space-y-3 mt-2 p-3 bg-base-200 rounded-lg">
      <!-- Start Date/Time -->
      <div class="grid grid-cols-2 gap-2">
        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs">Start Date *</span>
          </label>
          <input
            type="date"
            bind:value={startDate}
            min={minDate}
            required
            class="input input-bordered input-sm"
            on:change={emitChange}
          />
        </div>
        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs">Start Time</span>
          </label>
          <input
            type="time"
            bind:value={startTime}
            class="input input-bordered input-sm"
            on:change={emitChange}
          />
        </div>
      </div>

      <!-- End Date/Time -->
      <div class="grid grid-cols-2 gap-2">
        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs">End Date</span>
          </label>
          <input
            type="date"
            bind:value={endDate}
            min={startDate || minDate}
            class="input input-bordered input-sm"
            on:change={emitChange}
          />
        </div>
        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs">End Time</span>
          </label>
          <input
            type="time"
            bind:value={endTime}
            class="input input-bordered input-sm"
            on:change={emitChange}
          />
        </div>
      </div>

      <!-- Location -->
      <div class="form-control">
        <label class="label py-1">
          <span class="label-text text-xs">Location (optional)</span>
        </label>
        <input
          type="text"
          bind:value={location}
          placeholder="Add location..."
          class="input input-bordered input-sm"
          on:input={emitChange}
        />
      </div>

      <!-- Recurrence -->
      <div class="grid grid-cols-2 gap-2">
        <div class="form-control">
          <label class="label py-1">
            <span class="label-text text-xs">Repeat</span>
          </label>
          <select
            bind:value={recurrence}
            class="select select-bordered select-sm"
            on:change={emitChange}
          >
            {#each recurrenceOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        {#if recurrence !== 'none'}
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text text-xs">Until</span>
            </label>
            <input
              type="date"
              bind:value={recurrenceEnd}
              min={startDate || minDate}
              class="input input-bordered input-sm"
              on:change={emitChange}
            />
          </div>
        {/if}
      </div>

      {#if !startDate}
        <div class="text-xs text-warning mt-2">
          Please select a start date for your event
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .event-input.compact .event-fields {
    padding: 0.5rem;
  }

  .event-input.compact .form-control {
    margin-bottom: 0;
  }

  .event-input.compact .label {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
</style>
