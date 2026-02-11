/**
 * A2UI v0.9 Component Type Definitions
 */

/**
 * All standard A2UI component types (25 types including notification components)
 */
export type ComponentType =
  | 'card'
  | 'text'
  | 'button'
  | 'row'
  | 'column'
  | 'modal'
  | 'tabs'
  | 'list'
  | 'textField'
  | 'checkBox'
  | 'slider'
  | 'choicePicker'
  | 'dateTimeInput'
  | 'image'
  | 'video'
  | 'audioPlayer'
  | 'icon'
  | 'divider'
  | 'videoRecorder'
  | 'videoCall'
  | 'aiVideo'
  | 'aiVideoPlayer'
  | 'fileUpload'
  | 'notificationCenter'
  | 'notificationItem'
  | 'notificationBadge'

/**
 * Base component structure
 */
export interface A2UIComponent {
  /** Unique component identifier */
  id: string
  /** Component type */
  type: ComponentType | string
  /** Component properties (type-specific) */
  properties?: Record<string, unknown>
  /** Child component IDs */
  children?: string[]
}

/**
 * Component with typed properties
 */
export interface TypedA2UIComponent<T extends ComponentType> extends A2UIComponent {
  type: T
  properties?: ComponentProperties[T]
}

/**
 * Component property definitions by type
 */
export interface ComponentProperties {
  card: {
    title?: string
    subtitle?: string
    padding?: string | number
    backgroundColor?: string
    borderRadius?: string | number
    shadow?: boolean
  }
  text: {
    value: string
    fontSize?: string | number
    fontWeight?: 'normal' | 'bold' | 'light'
    color?: string
    align?: 'left' | 'center' | 'right'
  }
  button: {
    label: string
    action?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
  }
  row: {
    gap?: string | number
    align?: 'start' | 'center' | 'end' | 'stretch'
    justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  }
  column: {
    gap?: string | number
    align?: 'start' | 'center' | 'end' | 'stretch'
  }
  modal: {
    title?: string
    open: boolean
    onClose?: string
  }
  tabs: {
    activeTab?: string
    tabs: Array<{ id: string; label: string }>
  }
  list: {
    items: unknown[]
    itemTemplate?: string
    emptyMessage?: string
  }
  textField: {
    label?: string
    placeholder?: string
    value?: string
    dataBinding?: string
    type?: 'text' | 'email' | 'password' | 'number'
    required?: boolean
    disabled?: boolean
    error?: string
  }
  checkBox: {
    label?: string
    checked?: boolean
    dataBinding?: string
    disabled?: boolean
  }
  slider: {
    label?: string
    value?: number
    min?: number
    max?: number
    step?: number
    dataBinding?: string
    disabled?: boolean
  }
  choicePicker: {
    label?: string
    options: Array<{ value: string; label: string }>
    value?: string
    dataBinding?: string
    multiple?: boolean
    disabled?: boolean
  }
  dateTimeInput: {
    label?: string
    value?: string
    type?: 'date' | 'time' | 'datetime'
    dataBinding?: string
    disabled?: boolean
    min?: string
    max?: string
  }
  image: {
    src: string
    alt?: string
    width?: string | number
    height?: string | number
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  }
  video: {
    src: string
    poster?: string
    controls?: boolean
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
  }
  audioPlayer: {
    src: string
    controls?: boolean
    autoplay?: boolean
    loop?: boolean
  }
  icon: {
    name: string
    size?: string | number
    color?: string
  }
  divider: {
    orientation?: 'horizontal' | 'vertical'
    thickness?: string | number
    color?: string
  }
  videoRecorder: {
    mode: 'screen' | 'camera' | 'pip'
    audio?: boolean
    quality?: 'low' | 'medium' | 'high'
    ai?: {
      transcribe?: boolean
      highlights?: boolean
      summary?: boolean
      zerodb?: boolean
    }
    onStart?: string
    onComplete?: string
    onError?: string
  }
  videoCall: {
    roomId: string
    layout?: 'grid' | 'speaker' | 'sidebar'
    features?: {
      chat?: boolean
      screenShare?: boolean
      recording?: boolean
    }
    ai?: {
      liveTranscription?: boolean
      liveCaptions?: boolean
      translation?: string
      noiseCancellation?: boolean
      speakerIdentification?: boolean
      actionItemDetection?: boolean
    }
    onJoin?: string
    onLeave?: string
    onError?: string
  }
  aiVideo: {
    prompt?: string
    template?: string
    data?: Record<string, unknown>
    voice?: string
    streaming?: boolean
    onProgress?: string
    onComplete?: string
    onError?: string
  }
  aiVideoPlayer: {
    videoUrl: string
    transcript?: string
    interactive?: {
      allowQuestions?: boolean
      conversationalControl?: boolean
      smartChapters?: boolean
      semanticSearch?: boolean
    }
    onProgress?: string
    onQuestion?: string
  }
  fileUpload: {
    accept?: string[]
    multiple?: boolean
    maxFileSize?: number
    maxFiles?: number
    dragAndDrop?: boolean
    showProgress?: boolean
    showPreview?: boolean
    uploadEndpoint?: string
    metadata?: Record<string, unknown>
    label?: string
    helperText?: string
    disabled?: boolean
    error?: string
    onUploadStart?: string
    onUploadProgress?: string
    onUploadComplete?: string
    onUploadError?: string
  }
  notificationCenter: {
    maxVisible?: number
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
    autoHide?: boolean
    autoHideDuration?: number
    groupBy?: 'none' | 'type' | 'priority' | 'category' | 'date'
    filterType?: Array<'all' | 'unread' | 'read' | 'info' | 'success' | 'warning' | 'error' | 'system'>
    showBadge?: boolean
    sound?: boolean
    realtime?: boolean
    soundUrl?: string
    desktopNotifications?: boolean
    width?: string | number
    maxHeight?: string | number
    theme?: 'light' | 'dark' | 'auto'
    onNotificationClick?: string
    onNotificationDismiss?: string
    onActionClick?: string
    onMarkAllRead?: string
  }
  notificationItem: {
    notificationId: string
    notificationType: 'info' | 'success' | 'warning' | 'error' | 'system'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    title: string
    message: string
    timestamp: number
    read?: boolean
    actions?: Array<{
      id: string
      label: string
      action: string
      variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
      closeOnClick?: boolean
    }>
    richContent?: {
      image?: string
      html?: string
      progress?: number
      icon?: string
      link?: string
      linkText?: string
      metadata?: Record<string, unknown>
    }
    category?: 'account' | 'billing' | 'security' | 'system' | 'social' | 'update' | 'message' | 'alert' | 'reminder'
    dismissible?: boolean
    avatar?: string
    sender?: string
    link?: string
    expiresAt?: number
    onClick?: string
    onDismiss?: string
    onAction?: string
  }
  notificationBadge: {
    count: number
    maxCount?: number
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    dot?: boolean
    color?: string
    backgroundColor?: string
    animate?: boolean
    size?: 'sm' | 'md' | 'lg'
    ariaLabel?: string
    onClick?: string
  }
}
