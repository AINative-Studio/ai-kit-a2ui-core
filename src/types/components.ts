/**
 * A2UI v0.9 Component Type Definitions
 */

/**
 * All 17 standard A2UI component types
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
}
