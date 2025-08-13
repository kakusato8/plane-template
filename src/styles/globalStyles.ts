import { css } from '@emotion/react';
import { theme } from './theme';

export const globalStyles = css`
  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    width: 100%;
  }

  body {
    font-family: ${theme.typography.fonts.primary};
    font-size: ${theme.typography.sizes.base};
    line-height: 1.6;
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.background.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    height: 100%;
    width: 100%;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.typography.fonts.secondary};
    line-height: 1.2;
    color: ${theme.colors.text.primary};
  }

  p {
    margin-bottom: 1rem;
  }

  a {
    color: ${theme.colors.primary[600]};
    text-decoration: none;
    transition: color ${theme.animations.durations.fast} ease;
    
    &:hover {
      color: ${theme.colors.primary[700]};
    }
  }

  /* Form elements */
  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Focus styles for accessibility */
  *:focus {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }

  button:focus,
  [role="button"]:focus {
    outline-offset: 4px;
  }

  /* Remove focus outline for mouse users */
  *:focus:not(:focus-visible) {
    outline: none;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Selection styles */
  ::selection {
    background: ${theme.colors.primary[500]};
    color: white;
  }

  /* Scrollbar styles for webkit browsers */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.background.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary[400]};
    border-radius: ${theme.borderRadius.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.primary[500]};
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    body {
      background: white;
      color: black;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Mobile optimizations */
  @media (max-width: ${theme.breakpoints.md}) {
    body {
      font-size: ${theme.typography.sizes.sm};
    }
    
    /* Improve touch targets */
    button, [role="button"] {
      min-height: 44px;
      min-width: 44px;
    }
    
    /* Prevent zoom on form focus */
    input, select, textarea {
      font-size: 16px;
    }
  }

  /* Print styles */
  @media print {
    body {
      background: white;
      color: black;
    }
    
    * {
      box-shadow: none !important;
      text-shadow: none !important;
    }
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .loading {
    pointer-events: none;
    opacity: 0.7;
  }

  .fade-enter {
    opacity: 0;
  }

  .fade-enter-active {
    opacity: 1;
    transition: opacity ${theme.animations.durations.normal} ease;
  }

  .fade-exit {
    opacity: 1;
  }

  .fade-exit-active {
    opacity: 0;
    transition: opacity ${theme.animations.durations.normal} ease;
  }

  /* Dark mode support (for future use) */
  @media (prefers-color-scheme: dark) {
    body {
      background-color: ${theme.colors.background.dark};
      color: ${theme.colors.text.light};
    }
  }
`;