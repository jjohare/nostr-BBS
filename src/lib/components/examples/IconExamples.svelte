<script lang="ts">
  // Import icons from Lucide
  import {
    // Security & Auth
    Lock, Unlock, Key, Shield, ShieldCheck, ShieldAlert, Eye, EyeOff,
    // Chat & Messaging
    MessageCircle, Send, Reply, Edit, Trash2, Pin, Bookmark, Smile,
    // Navigation
    Home, Users, Settings, Bell, Menu, X, ChevronDown, Calendar,
    // Status & Feedback
    Check, CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, Loader2,
    // Actions
    Download, Upload, Copy, Share2, RefreshCw, Star,
    // User
    User, UserPlus, Mail, Globe, Link2
  } from 'lucide-svelte';
</script>

<div class="container mx-auto p-8 space-y-12">
  <h1 class="text-4xl font-bold mb-8">Lucide Icons - Usage Examples</h1>

  <!-- Security & Authentication -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Shield size={28} class="text-primary" />
      Security & Authentication
    </h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Login Button -->
      <button class="btn btn-primary">
        <Lock size={20} />
        Login
      </button>

      <!-- Show/Hide Password -->
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-square">
          <Eye size={20} />
        </button>
        <button class="btn btn-ghost btn-square">
          <EyeOff size={20} />
        </button>
      </div>

      <!-- Security Status -->
      <div class="badge badge-success gap-2">
        <ShieldCheck size={16} />
        Verified
      </div>

      <!-- Warning -->
      <div class="badge badge-warning gap-2">
        <ShieldAlert size={16} />
        Alert
      </div>
    </div>

    <!-- Security Warning Alert -->
    <div class="alert alert-warning mt-4">
      <ShieldAlert size={24} />
      <span>Remember to backup your keys securely!</span>
    </div>
  </section>

  <!-- Chat & Messaging -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <MessageCircle size={28} class="text-primary" />
      Chat & Messaging
    </h2>

    <div class="space-y-4">
      <!-- Message Actions -->
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm">
          <Send size={16} />
          Send
        </button>
        <button class="btn btn-ghost btn-sm">
          <Reply size={16} />
          Reply
        </button>
        <button class="btn btn-ghost btn-sm">
          <Edit size={16} />
          Edit
        </button>
        <button class="btn btn-ghost btn-sm">
          <Trash2 size={16} />
        </button>
      </div>

      <!-- Message Options -->
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm btn-circle" aria-label="Pin message">
          <Pin size={18} />
        </button>
        <button class="btn btn-ghost btn-sm btn-circle" aria-label="Bookmark">
          <Bookmark size={18} />
        </button>
        <button class="btn btn-ghost btn-sm btn-circle" aria-label="React">
          <Smile size={18} />
        </button>
      </div>
    </div>
  </section>

  <!-- Navigation -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Menu size={28} class="text-primary" />
      Navigation
    </h2>

    <!-- Nav Buttons -->
    <div class="flex gap-2 flex-wrap">
      <button class="btn btn-ghost">
        <Home size={20} />
        Home
      </button>
      <button class="btn btn-ghost">
        <Users size={20} />
        Community
      </button>
      <button class="btn btn-ghost">
        <Calendar size={20} />
        Events
      </button>
      <button class="btn btn-ghost">
        <Bell size={20} />
        <span class="badge badge-error badge-sm">3</span>
      </button>
      <button class="btn btn-ghost">
        <Settings size={20} />
      </button>
    </div>

    <!-- Mobile Menu Toggle -->
    <div class="mt-4 flex gap-2">
      <button class="btn btn-ghost btn-square">
        <Menu size={24} />
      </button>
      <button class="btn btn-ghost btn-square">
        <X size={24} />
      </button>
    </div>
  </section>

  <!-- Status & Feedback -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Info size={28} class="text-info" />
      Status & Feedback
    </h2>

    <div class="space-y-4">
      <!-- Alerts -->
      <div class="alert alert-success">
        <CheckCircle size={24} />
        <span>Operation completed successfully!</span>
      </div>

      <div class="alert alert-error">
        <XCircle size={24} />
        <span>An error occurred. Please try again.</span>
      </div>

      <div class="alert alert-warning">
        <AlertTriangle size={24} />
        <span>This action cannot be undone!</span>
      </div>

      <div class="alert alert-info">
        <Info size={24} />
        <span>Your changes have been saved.</span>
      </div>

      <!-- Loading State -->
      <div class="flex items-center gap-2">
        <Loader2 size={24} class="animate-spin text-primary" />
        <span>Loading...</span>
      </div>

      <!-- Simple Badges -->
      <div class="flex gap-2">
        <div class="badge badge-success gap-1">
          <Check size={14} />
          Done
        </div>
        <div class="badge badge-error gap-1">
          <XCircle size={14} />
          Failed
        </div>
        <div class="badge badge-warning gap-1">
          <AlertCircle size={14} />
          Pending
        </div>
      </div>
    </div>
  </section>

  <!-- Actions -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Download size={28} class="text-primary" />
      Actions
    </h2>

    <div class="flex gap-2 flex-wrap">
      <button class="btn btn-sm">
        <Download size={16} />
        Export
      </button>
      <button class="btn btn-sm">
        <Upload size={16} />
        Import
      </button>
      <button class="btn btn-sm">
        <Copy size={16} />
        Copy
      </button>
      <button class="btn btn-sm">
        <Share2 size={16} />
        Share
      </button>
      <button class="btn btn-sm btn-ghost">
        <RefreshCw size={16} />
      </button>
      <button class="btn btn-sm btn-ghost">
        <Star size={16} />
      </button>
    </div>
  </section>

  <!-- User Profile -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <User size={28} class="text-primary" />
      User Profile
    </h2>

    <div class="flex flex-col gap-4">
      <!-- User Card -->
      <div class="card bg-base-100">
        <div class="card-body">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-neutral text-neutral-content rounded-full w-12">
                <User size={24} />
              </div>
            </div>
            <div class="flex-1">
              <h3 class="font-bold">John Doe</h3>
              <div class="text-sm opacity-70 flex items-center gap-1">
                <Mail size={14} />
                john@example.com
              </div>
            </div>
            <button class="btn btn-primary btn-sm">
              <UserPlus size={16} />
              Follow
            </button>
          </div>

          <div class="flex gap-2 mt-2">
            <a href="/" class="btn btn-ghost btn-sm btn-circle">
              <Globe size={18} />
            </a>
            <button class="btn btn-ghost btn-sm btn-circle">
              <Link2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Icon Button Sizes -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4">Icon Sizes</h2>

    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <span class="w-20">Small (16px):</span>
        <Settings size={16} />
        <button class="btn btn-sm">
          <Settings size={16} />
          Settings
        </button>
      </div>

      <div class="flex items-center gap-4">
        <span class="w-20">Medium (20px):</span>
        <Settings size={20} />
        <button class="btn">
          <Settings size={20} />
          Settings
        </button>
      </div>

      <div class="flex items-center gap-4">
        <span class="w-20">Large (24px):</span>
        <Settings size={24} />
        <button class="btn btn-lg">
          <Settings size={24} />
          Settings
        </button>
      </div>

      <div class="flex items-center gap-4">
        <span class="w-20">X-Large (32px):</span>
        <Settings size={32} />
      </div>
    </div>
  </section>

  <!-- Animated Icons -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4">Animated Icons</h2>

    <div class="flex gap-4 items-center">
      <div class="flex flex-col items-center gap-2">
        <Loader2 size={32} class="animate-spin text-primary" />
        <span class="text-sm">Spin</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <Bell size={32} class="animate-pulse text-error" />
        <span class="text-sm">Pulse</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <Heart size={32} class="animate-bounce text-error" />
        <span class="text-sm">Bounce</span>
      </div>
    </div>
  </section>

  <!-- Accessibility Examples -->
  <section class="card bg-base-200 p-6">
    <h2 class="text-2xl font-bold mb-4">Accessibility</h2>

    <div class="space-y-4">
      <p class="text-sm opacity-70">
        Always include aria-label or sr-only text for icon-only buttons
      </p>

      <!-- Icon-only with aria-label -->
      <button class="btn btn-ghost btn-circle" aria-label="Delete message">
        <Trash2 size={20} />
      </button>

      <!-- Icon-only with sr-only -->
      <button class="btn btn-ghost btn-circle">
        <Settings size={20} />
        <span class="sr-only">Open settings</span>
      </button>

      <!-- Icon with visible text -->
      <button class="btn btn-primary">
        <Lock size={20} />
        Login
        <span class="sr-only">(opens login modal)</span>
      </button>
    </div>
  </section>
</div>

<script lang="ts">
  import { Heart } from 'lucide-svelte';
</script>
