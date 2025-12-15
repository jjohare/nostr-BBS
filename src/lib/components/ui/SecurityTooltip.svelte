<script lang="ts">
  export let type: 'private-key' | 'public-key' | 'backup' | 'nostr-keys';
  export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  export let inline: boolean = false;

  const tooltipContent = {
    'private-key': {
      icon: 'key',
      title: 'What is a Private Key?',
      text: 'Your private key (nsec) is like a master password for your Nostr account. It proves you own the account and lets you create posts, messages, and reactions. Anyone with your private key can impersonate you, so NEVER share it.',
      color: 'text-error'
    },
    'public-key': {
      icon: 'lock-open',
      title: 'What is a Public Key?',
      text: 'Your public key (npub) is your Nostr identity that others use to find and message you. It\'s safe to share publicly - think of it like your email address or username.',
      color: 'text-info'
    },
    'backup': {
      icon: 'shield',
      title: 'Why Backup is Important',
      text: 'Nostr accounts are controlled by cryptographic keys, not passwords. If you lose your recovery phrase, there is NO way to recover your account - not even Nostr developers can help. Write it down on paper and store it somewhere safe.',
      color: 'text-warning'
    },
    'nostr-keys': {
      icon: 'key-pair',
      title: 'How Nostr Keys Work',
      text: 'Nostr uses two keys: a public key (npub) that identifies you, and a private key (nsec) that proves you control that identity. This is similar to Bitcoin and other cryptocurrencies. Your keys stay with you, not on any server.',
      color: 'text-primary'
    }
  };

  const content = tooltipContent[type];

  function getIconSvg(iconType: string): string {
    switch (iconType) {
      case 'key':
        return 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z';
      case 'lock-open':
        return 'M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z';
      case 'shield':
        return 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z';
      case 'key-pair':
        return 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z';
      default:
        return '';
    }
  }
</script>

<div class="security-tooltip {inline ? 'inline-block' : ''}">
  <div class="tooltip tooltip-{position}" data-tip="{content.title}: {content.text}">
    <button class="btn btn-circle btn-ghost btn-xs" type="button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 {content.color}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d={getIconSvg(content.icon)}
        />
      </svg>
    </button>
  </div>
</div>

<style>
  .security-tooltip :global(.tooltip) {
    --tooltip-color: hsl(var(--b1));
    --tooltip-text-color: hsl(var(--bc));
  }

  .security-tooltip :global(.tooltip):before {
    max-width: 400px;
    white-space: normal;
    text-align: left;
    padding: 1rem;
    border: 1px solid hsl(var(--bc) / 0.1);
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 50;
  }
</style>
