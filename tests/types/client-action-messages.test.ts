/**
 * Client Action Messages Tests
 * Comprehensive tests for client action message types
 */

import { describe, it, expect } from 'vitest'
import type {
  ClientActionType,
  ClientActionMessage,
  ClientActionResponseMessage,
  PermissionType,
  NavigateAction,
  GoBackAction,
  GoForwardAction,
  RefreshAction,
  ScrollToAction,
  ShowToastAction,
  ShowModalAction,
  CloseModalAction,
  ShowDialogAction,
  CloseDialogAction,
  ShowNotificationAction,
  CopyToClipboardAction,
  DownloadFileAction,
  UploadFileAction,
  ShareContentAction,
  PrintPageAction,
  SetLocalStorageAction,
  GetLocalStorageAction,
  RemoveLocalStorageAction,
  ClearLocalStorageAction,
  RequestPermissionAction,
  GetUserMediaAction,
  OpenCameraAction,
  OpenGalleryAction,
  VibrateAction,
  TrackEventAction,
  TrackPageViewAction,
  SetUserPropertyAction,
  OpenUrlAction,
  SendEmailAction,
  MakePhoneCallAction,
  OpenMapAction,
  SpecificClientAction,
} from '../../src/types/client-action-messages.js'
import {
  isClientActionMessage,
  isClientActionResponseMessage,
  isNavigateAction,
  isGoBackAction,
  isGoForwardAction,
  isRefreshAction,
  isScrollToAction,
  isShowToastAction,
  isShowModalAction,
  isCloseModalAction,
  isShowDialogAction,
  isCloseDialogAction,
  isShowNotificationAction,
  isCopyToClipboardAction,
  isDownloadFileAction,
  isUploadFileAction,
  isShareContentAction,
  isPrintPageAction,
  isSetLocalStorageAction,
  isGetLocalStorageAction,
  isRemoveLocalStorageAction,
  isClearLocalStorageAction,
  isRequestPermissionAction,
  isGetUserMediaAction,
  isOpenCameraAction,
  isOpenGalleryAction,
  isVibrateAction,
  isTrackEventAction,
  isTrackPageViewAction,
  isSetUserPropertyAction,
  isOpenUrlAction,
  isSendEmailAction,
  isMakePhoneCallAction,
  isOpenMapAction,
} from '../../src/types/client-action-messages.js'

describe('Client Action Messages', () => {
  // ============================================================================
  // Message Structure Tests
  // ============================================================================

  describe('ClientActionMessage', () => {
    it('creates valid client action message', () => {
      const action: NavigateAction = {
        type: 'navigate',
        url: '/dashboard',
        target: '_self',
      }

      const message: ClientActionMessage = {
        type: 'clientAction',
        surfaceId: 'surface-1',
        actionId: 'action-123',
        actionType: 'navigate',
        action,
        timestamp: Date.now(),
      }

      expect(message.type).toBe('clientAction')
      expect(message.surfaceId).toBe('surface-1')
      expect(message.actionId).toBe('action-123')
      expect(message.actionType).toBe('navigate')
      expect(message.action.type).toBe('navigate')
    })

    it('includes permission requirements when needed', () => {
      const action: CopyToClipboardAction = {
        type: 'copyToClipboard',
        text: 'Hello, World!',
      }

      const message: ClientActionMessage = {
        type: 'clientAction',
        surfaceId: 'surface-1',
        actionId: 'action-124',
        actionType: 'copyToClipboard',
        action,
        requiresPermission: true,
        permissionType: 'clipboard-write',
        timestamp: Date.now(),
      }

      expect(message.requiresPermission).toBe(true)
      expect(message.permissionType).toBe('clipboard-write')
    })
  })

  describe('ClientActionResponseMessage', () => {
    it('creates success response', () => {
      const response: ClientActionResponseMessage = {
        type: 'clientActionResponse',
        actionId: 'action-123',
        success: true,
        result: { navigated: true },
        timestamp: Date.now(),
      }

      expect(response.type).toBe('clientActionResponse')
      expect(response.actionId).toBe('action-123')
      expect(response.success).toBe(true)
      expect(response.result).toEqual({ navigated: true })
    })

    it('creates error response', () => {
      const response: ClientActionResponseMessage = {
        type: 'clientActionResponse',
        actionId: 'action-124',
        success: false,
        error: 'Permission denied',
        errorCode: 'PERMISSION_DENIED',
        timestamp: Date.now(),
      }

      expect(response.success).toBe(false)
      expect(response.error).toBe('Permission denied')
      expect(response.errorCode).toBe('PERMISSION_DENIED')
    })
  })

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  describe('NavigateAction', () => {
    it('creates valid navigate action', () => {
      const action: NavigateAction = {
        type: 'navigate',
        url: '/dashboard',
        target: '_self',
        replace: false,
      }

      expect(action.type).toBe('navigate')
      expect(action.url).toBe('/dashboard')
      expect(action.target).toBe('_self')
      expect(action.replace).toBe(false)
    })

    it('supports external URLs', () => {
      const action: NavigateAction = {
        type: 'navigate',
        url: 'https://example.com',
        target: '_blank',
      }

      expect(action.url).toBe('https://example.com')
      expect(action.target).toBe('_blank')
    })
  })

  describe('GoBackAction', () => {
    it('creates valid go back action', () => {
      const action: GoBackAction = {
        type: 'goBack',
        steps: 2,
      }

      expect(action.type).toBe('goBack')
      expect(action.steps).toBe(2)
    })

    it('defaults to 1 step when not specified', () => {
      const action: GoBackAction = {
        type: 'goBack',
      }

      expect(action.steps).toBeUndefined()
    })
  })

  describe('GoForwardAction', () => {
    it('creates valid go forward action', () => {
      const action: GoForwardAction = {
        type: 'goForward',
        steps: 1,
      }

      expect(action.type).toBe('goForward')
      expect(action.steps).toBe(1)
    })
  })

  describe('RefreshAction', () => {
    it('creates refresh action with force reload', () => {
      const action: RefreshAction = {
        type: 'refresh',
        forceReload: true,
      }

      expect(action.type).toBe('refresh')
      expect(action.forceReload).toBe(true)
    })
  })

  describe('ScrollToAction', () => {
    it('scrolls to element by ID', () => {
      const action: ScrollToAction = {
        type: 'scrollTo',
        elementId: 'section-2',
        behavior: 'smooth',
      }

      expect(action.type).toBe('scrollTo')
      expect(action.elementId).toBe('section-2')
      expect(action.behavior).toBe('smooth')
    })

    it('scrolls to coordinates', () => {
      const action: ScrollToAction = {
        type: 'scrollTo',
        x: 0,
        y: 500,
        behavior: 'auto',
      }

      expect(action.x).toBe(0)
      expect(action.y).toBe(500)
    })
  })

  // ============================================================================
  // UI Feedback Actions
  // ============================================================================

  describe('ShowToastAction', () => {
    it('creates success toast', () => {
      const action: ShowToastAction = {
        type: 'showToast',
        message: 'File saved successfully',
        variant: 'success',
        duration: 3000,
        position: 'bottom-right',
      }

      expect(action.type).toBe('showToast')
      expect(action.message).toBe('File saved successfully')
      expect(action.variant).toBe('success')
      expect(action.duration).toBe(3000)
    })

    it('includes action button', () => {
      const action: ShowToastAction = {
        type: 'showToast',
        message: 'Item deleted',
        variant: 'info',
        action: {
          label: 'Undo',
          actionId: 'undo-delete',
        },
      }

      expect(action.action).toBeDefined()
      expect(action.action?.label).toBe('Undo')
    })
  })

  describe('ShowModalAction', () => {
    it('creates modal with content', () => {
      const action: ShowModalAction = {
        type: 'showModal',
        modalId: 'confirmation-modal',
        title: 'Confirm Action',
        content: '<p>Are you sure?</p>',
        size: 'medium',
        dismissible: true,
      }

      expect(action.type).toBe('showModal')
      expect(action.modalId).toBe('confirmation-modal')
      expect(action.title).toBe('Confirm Action')
      expect(action.dismissible).toBe(true)
    })
  })

  describe('CloseModalAction', () => {
    it('closes specific modal', () => {
      const action: CloseModalAction = {
        type: 'closeModal',
        modalId: 'confirmation-modal',
      }

      expect(action.type).toBe('closeModal')
      expect(action.modalId).toBe('confirmation-modal')
    })
  })

  describe('ShowDialogAction', () => {
    it('creates confirm dialog', () => {
      const action: ShowDialogAction = {
        type: 'showDialog',
        dialogType: 'confirm',
        message: 'Delete this item?',
      }

      expect(action.type).toBe('showDialog')
      expect(action.dialogType).toBe('confirm')
    })

    it('creates prompt dialog with default value', () => {
      const action: ShowDialogAction = {
        type: 'showDialog',
        dialogType: 'prompt',
        message: 'Enter your name:',
        defaultValue: 'John Doe',
      }

      expect(action.dialogType).toBe('prompt')
      expect(action.defaultValue).toBe('John Doe')
    })
  })

  describe('ShowNotificationAction', () => {
    it('creates browser notification', () => {
      const action: ShowNotificationAction = {
        type: 'showNotification',
        title: 'New Message',
        body: 'You have a new message from John',
        icon: '/icons/message.png',
        tag: 'msg-123',
      }

      expect(action.type).toBe('showNotification')
      expect(action.title).toBe('New Message')
      expect(action.tag).toBe('msg-123')
    })

    it('includes notification actions', () => {
      const action: ShowNotificationAction = {
        type: 'showNotification',
        title: 'Friend Request',
        body: 'John wants to connect',
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' },
        ],
      }

      expect(action.actions).toHaveLength(2)
      expect(action.actions?.[0].action).toBe('accept')
    })
  })

  // ============================================================================
  // Data Operations
  // ============================================================================

  describe('CopyToClipboardAction', () => {
    it('copies text to clipboard', () => {
      const action: CopyToClipboardAction = {
        type: 'copyToClipboard',
        text: 'Hello, World!',
      }

      expect(action.type).toBe('copyToClipboard')
      expect(action.text).toBe('Hello, World!')
    })
  })

  describe('DownloadFileAction', () => {
    it('downloads file from URL', () => {
      const action: DownloadFileAction = {
        type: 'downloadFile',
        url: '/api/files/report.pdf',
        filename: 'monthly-report.pdf',
        mimeType: 'application/pdf',
      }

      expect(action.type).toBe('downloadFile')
      expect(action.url).toBe('/api/files/report.pdf')
      expect(action.filename).toBe('monthly-report.pdf')
    })

    it('supports data URLs', () => {
      const action: DownloadFileAction = {
        type: 'downloadFile',
        url: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        filename: 'hello.txt',
      }

      expect(action.url).toContain('data:text/plain')
    })
  })

  describe('UploadFileAction', () => {
    it('triggers file upload with constraints', () => {
      const action: UploadFileAction = {
        type: 'uploadFile',
        accept: 'image/*',
        multiple: true,
        maxSize: 5 * 1024 * 1024,
        maxFiles: 10,
      }

      expect(action.type).toBe('uploadFile')
      expect(action.accept).toBe('image/*')
      expect(action.multiple).toBe(true)
      expect(action.maxFiles).toBe(10)
    })
  })

  describe('ShareContentAction', () => {
    it('shares URL and text', () => {
      const action: ShareContentAction = {
        type: 'shareContent',
        title: 'Check this out',
        text: 'Amazing content!',
        url: 'https://example.com',
      }

      expect(action.type).toBe('shareContent')
      expect(action.title).toBe('Check this out')
      expect(action.url).toBe('https://example.com')
    })

    it('shares files', () => {
      const action: ShareContentAction = {
        type: 'shareContent',
        files: [
          {
            name: 'photo.jpg',
            type: 'image/jpeg',
            url: 'blob:...',
          },
        ],
      }

      expect(action.files).toHaveLength(1)
      expect(action.files?.[0].name).toBe('photo.jpg')
    })
  })

  // ============================================================================
  // Print Actions
  // ============================================================================

  describe('PrintPageAction', () => {
    it('prints entire page', () => {
      const action: PrintPageAction = {
        type: 'printPage',
      }

      expect(action.type).toBe('printPage')
      expect(action.elementId).toBeUndefined()
    })

    it('prints specific element', () => {
      const action: PrintPageAction = {
        type: 'printPage',
        elementId: 'printable-content',
      }

      expect(action.elementId).toBe('printable-content')
    })
  })

  // ============================================================================
  // Storage Actions
  // ============================================================================

  describe('SetLocalStorageAction', () => {
    it('sets storage item', () => {
      const action: SetLocalStorageAction = {
        type: 'setLocalStorage',
        key: 'user-preferences',
        value: { theme: 'dark', language: 'en' },
      }

      expect(action.type).toBe('setLocalStorage')
      expect(action.key).toBe('user-preferences')
      expect(action.value).toEqual({ theme: 'dark', language: 'en' })
    })
  })

  describe('GetLocalStorageAction', () => {
    it('gets storage item', () => {
      const action: GetLocalStorageAction = {
        type: 'getLocalStorage',
        key: 'user-preferences',
      }

      expect(action.type).toBe('getLocalStorage')
      expect(action.key).toBe('user-preferences')
    })
  })

  describe('RemoveLocalStorageAction', () => {
    it('removes storage item', () => {
      const action: RemoveLocalStorageAction = {
        type: 'removeLocalStorage',
        key: 'old-data',
      }

      expect(action.type).toBe('removeLocalStorage')
      expect(action.key).toBe('old-data')
    })
  })

  describe('ClearLocalStorageAction', () => {
    it('clears all storage', () => {
      const action: ClearLocalStorageAction = {
        type: 'clearLocalStorage',
        confirm: true,
      }

      expect(action.type).toBe('clearLocalStorage')
      expect(action.confirm).toBe(true)
    })
  })

  // ============================================================================
  // Permission Actions
  // ============================================================================

  describe('RequestPermissionAction', () => {
    it('requests camera permission', () => {
      const action: RequestPermissionAction = {
        type: 'requestPermission',
        permission: 'camera',
        rationale: 'We need camera access for profile photos',
      }

      expect(action.type).toBe('requestPermission')
      expect(action.permission).toBe('camera')
      expect(action.rationale).toBeDefined()
    })

    it('supports all permission types', () => {
      const permissionTypes: PermissionType[] = [
        'camera',
        'microphone',
        'geolocation',
        'notifications',
        'clipboard-write',
        'clipboard-read',
        'storage',
        'media-devices',
      ]

      permissionTypes.forEach((permission) => {
        const action: RequestPermissionAction = {
          type: 'requestPermission',
          permission,
        }
        expect(action.permission).toBe(permission)
      })
    })
  })

  // ============================================================================
  // Media Actions
  // ============================================================================

  describe('GetUserMediaAction', () => {
    it('requests audio and video', () => {
      const action: GetUserMediaAction = {
        type: 'getUserMedia',
        audio: true,
        video: { width: 1280, height: 720 },
      }

      expect(action.type).toBe('getUserMedia')
      expect(action.audio).toBe(true)
      expect(action.video).toBeDefined()
    })
  })

  describe('OpenCameraAction', () => {
    it('opens camera for photo', () => {
      const action: OpenCameraAction = {
        type: 'openCamera',
        mode: 'photo',
        facingMode: 'user',
      }

      expect(action.type).toBe('openCamera')
      expect(action.mode).toBe('photo')
      expect(action.facingMode).toBe('user')
    })

    it('opens camera for video with duration', () => {
      const action: OpenCameraAction = {
        type: 'openCamera',
        mode: 'video',
        facingMode: 'environment',
        maxDuration: 60,
      }

      expect(action.mode).toBe('video')
      expect(action.maxDuration).toBe(60)
    })
  })

  describe('OpenGalleryAction', () => {
    it('opens gallery for images', () => {
      const action: OpenGalleryAction = {
        type: 'openGallery',
        mediaType: 'image',
        multiple: true,
        maxSelections: 5,
      }

      expect(action.type).toBe('openGallery')
      expect(action.mediaType).toBe('image')
      expect(action.maxSelections).toBe(5)
    })
  })

  // ============================================================================
  // Device Actions
  // ============================================================================

  describe('VibrateAction', () => {
    it('vibrates with single duration', () => {
      const action: VibrateAction = {
        type: 'vibrate',
        pattern: 200,
      }

      expect(action.type).toBe('vibrate')
      expect(action.pattern).toBe(200)
    })

    it('vibrates with pattern', () => {
      const action: VibrateAction = {
        type: 'vibrate',
        pattern: [100, 50, 100, 50, 100],
      }

      expect(action.pattern).toEqual([100, 50, 100, 50, 100])
    })
  })

  // ============================================================================
  // Analytics Actions
  // ============================================================================

  describe('TrackEventAction', () => {
    it('tracks event with properties', () => {
      const action: TrackEventAction = {
        type: 'trackEvent',
        eventName: 'button_click',
        properties: {
          button_id: 'submit',
          page: 'checkout',
        },
        value: 99.99,
      }

      expect(action.type).toBe('trackEvent')
      expect(action.eventName).toBe('button_click')
      expect(action.properties).toBeDefined()
      expect(action.value).toBe(99.99)
    })
  })

  describe('TrackPageViewAction', () => {
    it('tracks page view', () => {
      const action: TrackPageViewAction = {
        type: 'trackPageView',
        page: '/dashboard',
        title: 'Dashboard',
        properties: {
          section: 'main',
        },
      }

      expect(action.type).toBe('trackPageView')
      expect(action.page).toBe('/dashboard')
      expect(action.title).toBe('Dashboard')
    })
  })

  describe('SetUserPropertyAction', () => {
    it('sets user property', () => {
      const action: SetUserPropertyAction = {
        type: 'setUserProperty',
        property: 'plan',
        value: 'premium',
      }

      expect(action.type).toBe('setUserProperty')
      expect(action.property).toBe('plan')
      expect(action.value).toBe('premium')
    })
  })

  // ============================================================================
  // External Actions
  // ============================================================================

  describe('OpenUrlAction', () => {
    it('opens URL in new tab', () => {
      const action: OpenUrlAction = {
        type: 'openUrl',
        url: 'https://example.com',
        target: '_blank',
      }

      expect(action.type).toBe('openUrl')
      expect(action.url).toBe('https://example.com')
      expect(action.target).toBe('_blank')
    })
  })

  describe('SendEmailAction', () => {
    it('sends email with all fields', () => {
      const action: SendEmailAction = {
        type: 'sendEmail',
        to: 'support@example.com',
        subject: 'Help Request',
        body: 'I need help with...',
        cc: ['manager@example.com'],
        bcc: ['archive@example.com'],
      }

      expect(action.type).toBe('sendEmail')
      expect(action.to).toBe('support@example.com')
      expect(action.subject).toBe('Help Request')
      expect(action.cc).toHaveLength(1)
    })
  })

  describe('MakePhoneCallAction', () => {
    it('initiates phone call', () => {
      const action: MakePhoneCallAction = {
        type: 'makePhoneCall',
        phoneNumber: '+1-555-0100',
      }

      expect(action.type).toBe('makePhoneCall')
      expect(action.phoneNumber).toBe('+1-555-0100')
    })
  })

  describe('OpenMapAction', () => {
    it('opens map with address', () => {
      const action: OpenMapAction = {
        type: 'openMap',
        address: '1600 Amphitheatre Parkway, Mountain View, CA',
      }

      expect(action.type).toBe('openMap')
      expect(action.address).toBeDefined()
    })

    it('opens map with coordinates', () => {
      const action: OpenMapAction = {
        type: 'openMap',
        latitude: 37.422,
        longitude: -122.084,
      }

      expect(action.latitude).toBe(37.422)
      expect(action.longitude).toBe(-122.084)
    })

    it('shows directions', () => {
      const action: OpenMapAction = {
        type: 'openMap',
        address: '123 Start St',
        destination: '456 End Ave',
        travelMode: 'driving',
      }

      expect(action.destination).toBe('456 End Ave')
      expect(action.travelMode).toBe('driving')
    })
  })

  // ============================================================================
  // Type Guards Tests
  // ============================================================================

  describe('Message Type Guards', () => {
    it('identifies ClientActionMessage', () => {
      const action: NavigateAction = { type: 'navigate', url: '/test' }
      const message: ClientActionMessage = {
        type: 'clientAction',
        surfaceId: 'surface-1',
        actionId: 'action-1',
        actionType: 'navigate',
        action,
        timestamp: Date.now(),
      }

      expect(isClientActionMessage(message)).toBe(true)
      expect(isClientActionMessage({ type: 'other' })).toBe(false)
      expect(isClientActionMessage(null)).toBe(false)
      expect(isClientActionMessage(undefined)).toBe(false)
    })

    it('identifies ClientActionResponseMessage', () => {
      const response: ClientActionResponseMessage = {
        type: 'clientActionResponse',
        actionId: 'action-1',
        success: true,
        timestamp: Date.now(),
      }

      expect(isClientActionResponseMessage(response)).toBe(true)
      expect(isClientActionResponseMessage({ type: 'other' })).toBe(false)
      expect(isClientActionResponseMessage(null)).toBe(false)
    })
  })

  describe('Action Type Guards', () => {
    it('identifies navigation actions', () => {
      const navigate: NavigateAction = { type: 'navigate', url: '/test' }
      const goBack: GoBackAction = { type: 'goBack' }
      const goForward: GoForwardAction = { type: 'goForward' }
      const refresh: RefreshAction = { type: 'refresh' }
      const scrollTo: ScrollToAction = { type: 'scrollTo', y: 100 }

      expect(isNavigateAction(navigate)).toBe(true)
      expect(isGoBackAction(goBack)).toBe(true)
      expect(isGoForwardAction(goForward)).toBe(true)
      expect(isRefreshAction(refresh)).toBe(true)
      expect(isScrollToAction(scrollTo)).toBe(true)

      // Cross-checks
      expect(isNavigateAction(goBack as SpecificClientAction)).toBe(false)
      expect(isGoBackAction(navigate as SpecificClientAction)).toBe(false)
    })

    it('identifies UI feedback actions', () => {
      const showToast: ShowToastAction = { type: 'showToast', message: 'Hi' }
      const showModal: ShowModalAction = { type: 'showModal', modalId: 'm1', content: 'Content' }
      const closeModal: CloseModalAction = { type: 'closeModal', modalId: 'm1' }
      const showDialog: ShowDialogAction = { type: 'showDialog', dialogType: 'alert', message: 'Hi' }
      const closeDialog: CloseDialogAction = { type: 'closeDialog' }
      const showNotification: ShowNotificationAction = { type: 'showNotification', title: 'Title' }

      expect(isShowToastAction(showToast)).toBe(true)
      expect(isShowModalAction(showModal)).toBe(true)
      expect(isCloseModalAction(closeModal)).toBe(true)
      expect(isShowDialogAction(showDialog)).toBe(true)
      expect(isCloseDialogAction(closeDialog)).toBe(true)
      expect(isShowNotificationAction(showNotification)).toBe(true)
    })

    it('identifies data operation actions', () => {
      const copy: CopyToClipboardAction = { type: 'copyToClipboard', text: 'text' }
      const download: DownloadFileAction = { type: 'downloadFile', url: '/file' }
      const upload: UploadFileAction = { type: 'uploadFile' }
      const share: ShareContentAction = { type: 'shareContent', url: '/share' }

      expect(isCopyToClipboardAction(copy)).toBe(true)
      expect(isDownloadFileAction(download)).toBe(true)
      expect(isUploadFileAction(upload)).toBe(true)
      expect(isShareContentAction(share)).toBe(true)
    })

    it('identifies print action', () => {
      const print: PrintPageAction = { type: 'printPage' }
      expect(isPrintPageAction(print)).toBe(true)
    })

    it('identifies storage actions', () => {
      const set: SetLocalStorageAction = { type: 'setLocalStorage', key: 'k', value: 'v' }
      const get: GetLocalStorageAction = { type: 'getLocalStorage', key: 'k' }
      const remove: RemoveLocalStorageAction = { type: 'removeLocalStorage', key: 'k' }
      const clear: ClearLocalStorageAction = { type: 'clearLocalStorage' }

      expect(isSetLocalStorageAction(set)).toBe(true)
      expect(isGetLocalStorageAction(get)).toBe(true)
      expect(isRemoveLocalStorageAction(remove)).toBe(true)
      expect(isClearLocalStorageAction(clear)).toBe(true)
    })

    it('identifies permission action', () => {
      const request: RequestPermissionAction = { type: 'requestPermission', permission: 'camera' }
      expect(isRequestPermissionAction(request)).toBe(true)
    })

    it('identifies media actions', () => {
      const getUserMedia: GetUserMediaAction = { type: 'getUserMedia', audio: true }
      const openCamera: OpenCameraAction = { type: 'openCamera', mode: 'photo' }
      const openGallery: OpenGalleryAction = { type: 'openGallery', mediaType: 'image' }

      expect(isGetUserMediaAction(getUserMedia)).toBe(true)
      expect(isOpenCameraAction(openCamera)).toBe(true)
      expect(isOpenGalleryAction(openGallery)).toBe(true)
    })

    it('identifies device action', () => {
      const vibrate: VibrateAction = { type: 'vibrate', pattern: 200 }
      expect(isVibrateAction(vibrate)).toBe(true)
    })

    it('identifies analytics actions', () => {
      const trackEvent: TrackEventAction = { type: 'trackEvent', eventName: 'click' }
      const trackPageView: TrackPageViewAction = { type: 'trackPageView', page: '/' }
      const setUserProperty: SetUserPropertyAction = { type: 'setUserProperty', property: 'plan', value: 'pro' }

      expect(isTrackEventAction(trackEvent)).toBe(true)
      expect(isTrackPageViewAction(trackPageView)).toBe(true)
      expect(isSetUserPropertyAction(setUserProperty)).toBe(true)
    })

    it('identifies external actions', () => {
      const openUrl: OpenUrlAction = { type: 'openUrl', url: 'https://example.com' }
      const sendEmail: SendEmailAction = { type: 'sendEmail', to: 'test@test.com' }
      const makePhoneCall: MakePhoneCallAction = { type: 'makePhoneCall', phoneNumber: '555-0100' }
      const openMap: OpenMapAction = { type: 'openMap', address: '123 Main St' }

      expect(isOpenUrlAction(openUrl)).toBe(true)
      expect(isSendEmailAction(sendEmail)).toBe(true)
      expect(isMakePhoneCallAction(makePhoneCall)).toBe(true)
      expect(isOpenMapAction(openMap)).toBe(true)
    })
  })

  // ============================================================================
  // Type Validation Tests
  // ============================================================================

  describe('Type Validation', () => {
    it('enforces ClientActionType values', () => {
      const validTypes: ClientActionType[] = [
        'navigate',
        'goBack',
        'goForward',
        'refresh',
        'scrollTo',
        'showToast',
        'showModal',
        'closeModal',
        'showDialog',
        'closeDialog',
        'showNotification',
        'copyToClipboard',
        'downloadFile',
        'uploadFile',
        'shareContent',
        'printPage',
        'setLocalStorage',
        'getLocalStorage',
        'removeLocalStorage',
        'clearLocalStorage',
        'requestPermission',
        'getUserMedia',
        'openCamera',
        'openGallery',
        'vibrate',
        'trackEvent',
        'trackPageView',
        'setUserProperty',
        'openUrl',
        'sendEmail',
        'makePhoneCall',
        'openMap',
      ]

      expect(validTypes).toHaveLength(32)
      validTypes.forEach((type) => {
        expect(typeof type).toBe('string')
      })
    })

    it('enforces PermissionType values', () => {
      const validPermissions: PermissionType[] = [
        'camera',
        'microphone',
        'geolocation',
        'notifications',
        'clipboard-write',
        'clipboard-read',
        'storage',
        'media-devices',
      ]

      expect(validPermissions).toHaveLength(8)
    })
  })
})
