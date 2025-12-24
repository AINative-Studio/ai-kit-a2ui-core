/**
 * A2UI Component Registry
 * Catalog system for component types
 */

/**
 * Component definition
 */
export interface ComponentDefinition {
  /** Component type identifier */
  type: string
  /** Display name */
  displayName?: string
  /** Description */
  description?: string
  /** Property schema (JSON Schema) */
  schema?: Record<string, unknown>
  /** Default properties */
  defaultProps?: Record<string, unknown>
  /** Category for grouping */
  category?: 'layout' | 'content' | 'input' | 'media' | 'misc'
  /** Tags for search */
  tags?: string[]
}

/**
 * Component Registry class
 * Manages component type definitions
 */
export class ComponentRegistry {
  private readonly definitions = new Map<string, ComponentDefinition>()

  /**
   * Register a component type
   */
  register(type: string, definition: ComponentDefinition): void {
    this.definitions.set(type, { ...definition, type })
  }

  /**
   * Get a component definition
   */
  get(type: string): ComponentDefinition | undefined {
    return this.definitions.get(type)
  }

  /**
   * Check if a component type is registered
   */
  has(type: string): boolean {
    return this.definitions.has(type)
  }

  /**
   * Unregister a component type
   */
  unregister(type: string): boolean {
    return this.definitions.delete(type)
  }

  /**
   * Get all registered component types
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * Get components by category
   */
  getByCategory(category: ComponentDefinition['category']): ComponentDefinition[] {
    return this.getAll().filter((def) => def.category === category)
  }

  /**
   * Search components by tag
   */
  searchByTag(tag: string): ComponentDefinition[] {
    return this.getAll().filter((def) => def.tags?.includes(tag))
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.definitions.clear()
  }

  /**
   * Get standard A2UI v0.9 component registry
   * Pre-loaded with all 17 standard components
   */
  static standard(): ComponentRegistry {
    const registry = new ComponentRegistry()

    // Layout components
    registry.register('card', {
      type: 'card',
      displayName: 'Card',
      description: 'Container with optional title, subtitle, and styling',
      category: 'layout',
      tags: ['container', 'layout'],
      defaultProps: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadow: true,
      },
    })

    registry.register('row', {
      type: 'row',
      displayName: 'Row',
      description: 'Horizontal layout container',
      category: 'layout',
      tags: ['container', 'layout', 'flex'],
      defaultProps: {
        gap: 8,
        align: 'start',
        justify: 'start',
      },
    })

    registry.register('column', {
      type: 'column',
      displayName: 'Column',
      description: 'Vertical layout container',
      category: 'layout',
      tags: ['container', 'layout', 'flex'],
      defaultProps: {
        gap: 8,
        align: 'start',
      },
    })

    registry.register('modal', {
      type: 'modal',
      displayName: 'Modal',
      description: 'Overlay dialog container',
      category: 'layout',
      tags: ['container', 'overlay', 'dialog'],
      defaultProps: {
        open: false,
      },
    })

    registry.register('tabs', {
      type: 'tabs',
      displayName: 'Tabs',
      description: 'Tabbed content container',
      category: 'layout',
      tags: ['container', 'navigation'],
      defaultProps: {
        tabs: [],
      },
    })

    // Content components
    registry.register('text', {
      type: 'text',
      displayName: 'Text',
      description: 'Text content display',
      category: 'content',
      tags: ['text', 'typography'],
      defaultProps: {
        value: '',
        fontSize: 14,
        fontWeight: 'normal',
        align: 'left',
      },
    })

    registry.register('button', {
      type: 'button',
      displayName: 'Button',
      description: 'Clickable button',
      category: 'input',
      tags: ['button', 'action', 'interactive'],
      defaultProps: {
        label: 'Button',
        variant: 'primary',
        size: 'md',
        disabled: false,
      },
    })

    registry.register('list', {
      type: 'list',
      displayName: 'List',
      description: 'Repeating item list',
      category: 'content',
      tags: ['list', 'repeater'],
      defaultProps: {
        items: [],
        emptyMessage: 'No items',
      },
    })

    registry.register('divider', {
      type: 'divider',
      displayName: 'Divider',
      description: 'Visual separator',
      category: 'content',
      tags: ['divider', 'separator'],
      defaultProps: {
        orientation: 'horizontal',
      },
    })

    // Input components
    registry.register('textField', {
      type: 'textField',
      displayName: 'Text Field',
      description: 'Text input field',
      category: 'input',
      tags: ['input', 'form', 'text'],
      defaultProps: {
        type: 'text',
        required: false,
        disabled: false,
      },
    })

    registry.register('checkBox', {
      type: 'checkBox',
      displayName: 'Checkbox',
      description: 'Boolean checkbox input',
      category: 'input',
      tags: ['input', 'form', 'boolean'],
      defaultProps: {
        checked: false,
        disabled: false,
      },
    })

    registry.register('slider', {
      type: 'slider',
      displayName: 'Slider',
      description: 'Numeric range slider',
      category: 'input',
      tags: ['input', 'form', 'range'],
      defaultProps: {
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        disabled: false,
      },
    })

    registry.register('choicePicker', {
      type: 'choicePicker',
      displayName: 'Choice Picker',
      description: 'Single or multi-select dropdown',
      category: 'input',
      tags: ['input', 'form', 'select', 'dropdown'],
      defaultProps: {
        options: [],
        multiple: false,
        disabled: false,
      },
    })

    registry.register('dateTimeInput', {
      type: 'dateTimeInput',
      displayName: 'Date Time Input',
      description: 'Date/time picker input',
      category: 'input',
      tags: ['input', 'form', 'date', 'time'],
      defaultProps: {
        type: 'date',
        disabled: false,
      },
    })

    // Media components
    registry.register('image', {
      type: 'image',
      displayName: 'Image',
      description: 'Image display',
      category: 'media',
      tags: ['media', 'image'],
      defaultProps: {
        src: '',
        objectFit: 'cover',
      },
    })

    registry.register('video', {
      type: 'video',
      displayName: 'Video',
      description: 'Video player',
      category: 'media',
      tags: ['media', 'video'],
      defaultProps: {
        src: '',
        controls: true,
        autoplay: false,
        loop: false,
        muted: false,
      },
    })

    registry.register('audioPlayer', {
      type: 'audioPlayer',
      displayName: 'Audio Player',
      description: 'Audio playback',
      category: 'media',
      tags: ['media', 'audio'],
      defaultProps: {
        src: '',
        controls: true,
        autoplay: false,
        loop: false,
      },
    })

    registry.register('icon', {
      type: 'icon',
      displayName: 'Icon',
      description: 'Icon display',
      category: 'content',
      tags: ['icon', 'visual'],
      defaultProps: {
        name: 'star',
        size: 24,
      },
    })

    return registry
  }
}
