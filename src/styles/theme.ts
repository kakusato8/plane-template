/**
 * CurioCity デザインシステム
 */

export const theme = {
  colors: {
    // プライマリカラー
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // 幻想的な色彩
    mystical: {
      purple: '#6366f1',
      pink: '#ec4899',
      teal: '#14b8a6',
      amber: '#f59e0b',
      emerald: '#10b981',
    },

    // 雰囲気別カラーパレット
    atmosphere: {
      mysterious: '#1e1b4b',
      romantic: '#be185d',
      epic: '#b45309',
      nostalgic: '#a16207',
      serene: '#065f46',
      dark: '#0f172a',
      joyful: '#ea580c',
      melancholic: '#4338ca',
    },

    // セマンティックカラー
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      light: '#f9fafb',
      overlay: 'rgba(255, 255, 255, 0.9)',
      // アクセシビリティ対応色（WCAG AA準拠）
      highContrast: '#1a202c',
      mediumContrast: '#2d3748',
      lightContrast: '#4a5568',
    },

    // ステータスカラー
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',

    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      dark: '#111827',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    // グラデーション
    gradients: {
      mystical: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      ocean: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      forest: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      galaxy: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
  },

  typography: {
    fonts: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      secondary: '"Playfair Display", serif',
      mono: '"JetBrains Mono", monospace',
    },
    
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },

    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(99, 102, 241, 0.5)',
    mystical: '0 0 30px rgba(139, 92, 246, 0.3)',
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  animations: {
    durations: {
      fast: '150ms',
      medium: '300ms',
      normal: '300ms',
      slow: '500ms',
      slower: '750ms',
    },
    
    easings: {
      easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounceOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const;

export type Theme = typeof theme;