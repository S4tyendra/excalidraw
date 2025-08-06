// Service Worker Registration Utility
// This handles the registration and lifecycle of the service worker

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: Error) => void
  onOffline?: () => void
  onOnline?: () => void
}

class ServiceWorkerManager {
  private isLocalhost: boolean
  private registration: ServiceWorkerRegistration | null = null
  private config: ServiceWorkerConfig
  private initialized: boolean = false

  constructor(config: ServiceWorkerConfig = {}) {
    this.config = config
    this.isLocalhost = false
    // Don't initialize immediately - wait for init() to be called
  }

  private init() {
    if (this.initialized || typeof window === 'undefined') return
    
    this.isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    )

    this.setupNetworkListeners()
    this.initialized = true
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    this.init() // Initialize only when actually needed
    
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported or running on server')
      return null
    }

    try {
      console.log('[SW] Registering service worker...')
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.registration = registration
      this.setupUpdateHandling(registration)
      
      console.log('[SW] Service Worker registered successfully:', registration)
      this.config.onSuccess?.(registration)
      
      return registration
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
      this.config.onError?.(error as Error)
      return null
    }
  }

  private setupUpdateHandling(registration: ServiceWorkerRegistration) {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      
      if (!newWorker) return

      console.log('[SW] New service worker found, installing...')

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[SW] New content available, update ready')
            this.config.onUpdate?.(registration)
            this.showUpdateNotification()
          } else {
            // Content cached for offline use
            console.log('[SW] Content cached for offline use')
            this.showOfflineReadyNotification()
          }
        }
      })
    })

    // Handle controller change (when new SW takes over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading page...')
      window.location.reload()
    })
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('[SW] Back online')
      this.config.onOnline?.()
      this.showOnlineNotification()
    })

    window.addEventListener('offline', () => {
      console.log('[SW] Gone offline')
      this.config.onOffline?.()
      this.showOfflineNotification()
    })
  }

  async update(): Promise<void> {
    if (!this.registration) {
      console.log('[SW] No registration found for update')
      return
    }

    try {
      console.log('[SW] Checking for updates...')
      await this.registration.update()
    } catch (error) {
      console.error('[SW] Update check failed:', error)
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const result = await this.registration.unregister()
      console.log('[SW] Service Worker unregistered:', result)
      return result
    } catch (error) {
      console.error('[SW] Service Worker unregistration failed:', error)
      return false
    }
  }

  private showUpdateNotification() {
    // Create a simple notification for updates
    const notification = this.createNotification(
      'App Update Available',
      'A new version is available. Refresh to update.',
      'update'
    )

    const refreshButton = notification.querySelector('[data-action="refresh"]')
    refreshButton?.addEventListener('click', () => {
      window.location.reload()
    })
  }

  private showOfflineReadyNotification() {
    this.createNotification(
      'App Ready for Offline Use',
      'The app has been cached and is ready to work offline.',
      'success'
    )
  }

  private showOfflineNotification() {
    this.createNotification(
      'You\'re Offline',
      'The app will continue to work with cached content.',
      'warning'
    )
  }

  private showOnlineNotification() {
    this.createNotification(
      'Back Online',
      'Connection restored. The app will sync any changes.',
      'success'
    )
  }

  private createNotification(title: string, message: string, type: 'update' | 'success' | 'warning'): HTMLElement {
    // Remove any existing notifications
    const existing = document.querySelector('.sw-notification')
    existing?.remove()

    const notification = document.createElement('div')
    notification.className = `sw-notification sw-notification--${type}`
    notification.innerHTML = `
      <div class="sw-notification__content">
        <div class="sw-notification__title">${title}</div>
        <div class="sw-notification__message">${message}</div>
        ${type === 'update' ? `
          <div class="sw-notification__actions">
            <button data-action="refresh" class="sw-notification__button sw-notification__button--primary">
              Refresh
            </button>
            <button data-action="dismiss" class="sw-notification__button sw-notification__button--secondary">
              Later
            </button>
          </div>
        ` : `
          <button data-action="dismiss" class="sw-notification__button sw-notification__button--secondary">
            Dismiss
          </button>
        `}
      </div>
    `

    // Add styles
    const style = document.createElement('style')
    style.textContent = `
      .sw-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 320px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-left: 4px solid #3b82f6;
        z-index: 10000;
        animation: sw-slide-in 0.3s ease-out;
      }
      
      .sw-notification--update {
        border-left-color: #3b82f6;
      }
      
      .sw-notification--success {
        border-left-color: #10b981;
      }
      
      .sw-notification--warning {
        border-left-color: #f59e0b;
      }
      
      .sw-notification__content {
        padding: 16px;
      }
      
      .sw-notification__title {
        font-weight: 600;
        font-size: 14px;
        color: #1f2937;
        margin-bottom: 4px;
      }
      
      .sw-notification__message {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.4;
        margin-bottom: 12px;
      }
      
      .sw-notification__actions {
        display: flex;
        gap: 8px;
      }
      
      .sw-notification__button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .sw-notification__button--primary {
        background: #3b82f6;
        color: white;
      }
      
      .sw-notification__button--primary:hover {
        background: #2563eb;
      }
      
      .sw-notification__button--secondary {
        background: #f3f4f6;
        color: #374151;
      }
      
      .sw-notification__button--secondary:hover {
        background: #e5e7eb;
      }
      
      @keyframes sw-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes sw-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .sw-notification--dismissing {
        animation: sw-slide-out 0.3s ease-in forwards;
      }
    `

    if (!document.querySelector('#sw-notification-styles')) {
      style.id = 'sw-notification-styles'
      document.head.appendChild(style)
    }

    // Handle dismiss
    const dismissButton = notification.querySelector('[data-action="dismiss"]')
    dismissButton?.addEventListener('click', () => {
      notification.classList.add('sw-notification--dismissing')
      setTimeout(() => notification.remove(), 300)
    })

    // Auto dismiss after 5 seconds (except for updates)
    if (type !== 'update') {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.classList.add('sw-notification--dismissing')
          setTimeout(() => notification.remove(), 300)
        }
      }, 5000)
    }

    document.body.appendChild(notification)
    return notification
  }

  // Public method to check if we're offline
  isOffline(): boolean {
    return !navigator.onLine
  }

  // Public method to get registration
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager()

// Export function for easy registration
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<ServiceWorkerRegistration | null> {
  if (config) {
    // Update config
    Object.assign(serviceWorkerManager['config'], config)
  }
  
  return await serviceWorkerManager.register()
}

// Export for manual update checking
export async function checkForUpdates(): Promise<void> {
  await serviceWorkerManager.update()
}

// Export for unregistration
export async function unregisterServiceWorker(): Promise<boolean> {
  return await serviceWorkerManager.unregister()
}
