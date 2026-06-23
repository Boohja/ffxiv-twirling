<script lang="ts">
  import { onMount } from 'svelte';

  const containerId = 'kofi-footer-widget';
  const scriptId = 'kofi-widget-overlay-script';

  onMount(() => {
    let popupObserver: MutationObserver | undefined;

    const getPopupHeight = () => {
      const container = document.getElementById(containerId);
      const widget = container?.querySelector('.floatingchat-container-wrap, .floatingchat-container-wrap-mobi');
      const widgetTop = widget?.getBoundingClientRect().top;

      if (widgetTop === undefined) {
        return undefined;
      }

      return Math.min(690, Math.max(400, widgetTop - 60));
    };

    const updateOpenPopupHeight = () => {
      const container = document.getElementById(containerId);
      const popup = container?.querySelector<HTMLElement>('.floating-chat-kofi-popup-iframe, .floating-chat-kofi-popup-iframe-mobi');
      const popupHeight = getPopupHeight();

      if (!popup || popupHeight === undefined || popup.style.opacity !== '1') {
        return;
      }

      const height = `${popupHeight}px`;

      if (popup.style.height !== height) {
        popup.style.setProperty('height', height, 'important');
      }
    };

    const updateWidgetPosition = () => {
      const container = document.getElementById(containerId);
      const widget = container?.querySelector('.floatingchat-container-wrap, .floatingchat-container-wrap-mobi');
      const widgetTop = widget?.getBoundingClientRect().top;

      if (widgetTop !== undefined) {
        container?.style.setProperty('--kofi-button-top', `${widgetTop}px`);
      }

      updateOpenPopupHeight();
    };

    const observePopup = () => {
      const container = document.getElementById(containerId);

      if (!container || popupObserver) {
        return;
      }

      popupObserver = new MutationObserver(updateOpenPopupHeight);
      popupObserver.observe(container, {
        attributes: true,
        attributeFilter: ['style'],
        childList: true,
        subtree: true
      });
    };

    const drawWidget = () => {
      const kofiWidgetOverlay = (window as typeof window & {
        kofiWidgetOverlay?: {
          draw: (pageId: string, config: Record<string, string>, containerId: string) => void;
        };
      }).kofiWidgetOverlay;

      kofiWidgetOverlay?.draw(
        'boohja',
        {
          type: 'floating-chat',
          'floating-chat.donateButton.text': 'Support me',
          'floating-chat.donateButton.background-color': '#00b9fe',
          'floating-chat.donateButton.text-color': '#fff'
        },
        containerId
      );

      observePopup();
      window.setTimeout(updateWidgetPosition, 500);
      window.setTimeout(updateWidgetPosition, 1000);
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    window.addEventListener('scroll', updateWidgetPosition, { passive: true });
    window.addEventListener('resize', updateWidgetPosition);

    if (existingScript) {
      drawWidget();
      return () => {
        popupObserver?.disconnect();
        window.removeEventListener('scroll', updateWidgetPosition);
        window.removeEventListener('resize', updateWidgetPosition);
      };
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.addEventListener('load', drawWidget, { once: true });
    document.body.appendChild(script);

    return () => {
      popupObserver?.disconnect();
      window.removeEventListener('scroll', updateWidgetPosition);
      window.removeEventListener('resize', updateWidgetPosition);
    };
  });
</script>

<div class="bg-gray-900 text-slate-600 py-4">
  <div class="container flex flex-wrap items-center justify-between gap-4 mx-auto">
    <div class="text-sm leading-relaxed">
      &copy; SQUARE ENIX CO., LTD. All Rights Reserved.<br>
      FINAL FANTASY&reg; and FINAL FANTASY XIV&reg; are registered trademarks of Square Enix Holdings Co., Ltd.<br>
      This site is a fan project and is not affiliated with or endorsed by Square Enix.
    </div>
    <div class="flex flex-col items-end gap-2">
      <a class="flex items-center gap-4 px-3 py-2 grayscale rounded-lg transition-all duration-300 hover:scale-110 hover:bg-slate-800/30 hover:shadow-lg hover:grayscale-0 hover:shadow-blue-500/20 hover:text-slate-400" href="https://discord.com/users/850980511606505494" target="_blank" rel="noopener noreferrer" aria-label="Contact the developer on Discord">
        <div class="transition-colors duration-300">
          Made by Aeron<br>
          from Phoenix
        </div>
        <div>
          <img src="/images/aeron.webp" alt="Aeron's Logo" class="h-12 w-12 rounded-full inline-block transition-transform opacity-80 duration-500 hover:opacity-100 hover:rotate-12 hover:scale-150" />
        </div>
      </a>
      <div id={containerId} class="kofi-footer-widget"></div>
    </div>
  </div>
</div>

<style>
  .kofi-footer-widget {
    position: relative;
    width: 195px;
    height: 65px;
  }

  .kofi-footer-widget :global(.floatingchat-container-wrap),
  .kofi-footer-widget :global(.floatingchat-container-wrap-mobi) {
    position: absolute !important;
    inset: auto 0 0 auto !important;
    width: 195px !important;
    max-width: 195px !important;
    height: 65px !important;
    opacity: 1 !important;
  }

  .kofi-footer-widget :global(.floating-chat-kofi-popup-iframe),
  .kofi-footer-widget :global(.floating-chat-kofi-popup-iframe-mobi) {
    position: absolute !important;
    right: 0 !important;
    bottom: 75px !important;
    left: auto !important;
  }

  @media only screen and (max-width: 360px) {
    .kofi-footer-widget :global(.floating-chat-kofi-popup-iframe),
    .kofi-footer-widget :global(.floating-chat-kofi-popup-iframe-mobi) {
      right: -8px !important;
      width: calc(100vw - 24px) !important;
    }
  }
</style>
