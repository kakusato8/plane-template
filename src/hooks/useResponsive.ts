import { useState, useEffect } from 'react';
import { theme } from '../styles/theme';

export interface BreakpointValues {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoints: BreakpointValues;
  orientation: 'portrait' | 'landscape';
}

// ブレークポイントの数値を取得
const getBreakpointValue = (breakpoint: string): number => {
  return parseInt(breakpoint.replace('px', ''), 10);
};

const breakpointValues = {
  sm: getBreakpointValue(theme.breakpoints.sm),
  md: getBreakpointValue(theme.breakpoints.md),
  lg: getBreakpointValue(theme.breakpoints.lg),
  xl: getBreakpointValue(theme.breakpoints.xl),
  '2xl': getBreakpointValue(theme.breakpoints['2xl']),
};

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    // SSR対応のための初期値
    const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const initialHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    
    return {
      width: initialWidth,
      height: initialHeight,
      isMobile: initialWidth < breakpointValues.md,
      isTablet: initialWidth >= breakpointValues.md && initialWidth < breakpointValues.lg,
      isDesktop: initialWidth >= breakpointValues.lg,
      breakpoints: {
        sm: initialWidth >= breakpointValues.sm,
        md: initialWidth >= breakpointValues.md,
        lg: initialWidth >= breakpointValues.lg,
        xl: initialWidth >= breakpointValues.xl,
        '2xl': initialWidth >= breakpointValues['2xl'],
      },
      orientation: initialWidth > initialHeight ? 'landscape' : 'portrait',
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        width,
        height,
        isMobile: width < breakpointValues.md,
        isTablet: width >= breakpointValues.md && width < breakpointValues.lg,
        isDesktop: width >= breakpointValues.lg,
        breakpoints: {
          sm: width >= breakpointValues.sm,
          md: width >= breakpointValues.md,
          lg: width >= breakpointValues.lg,
          xl: width >= breakpointValues.xl,
          '2xl': width >= breakpointValues['2xl'],
        },
        orientation: width > height ? 'landscape' : 'portrait',
      });
    };

    // 初期化時に一度実行
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
};

// 特定のブレークポイント以上かどうかを判定するヘルパーフック
export const useBreakpoint = (breakpoint: keyof typeof breakpointValues): boolean => {
  const { breakpoints } = useResponsive();
  return breakpoints[breakpoint];
};

// デバイスタイプを判定するヘルパーフック
export const useDeviceType = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isDesktop) return 'desktop';
  return 'unknown';
};

// 画面の向きを判定するヘルパーフック
export const useOrientation = () => {
  const { orientation } = useResponsive();
  return orientation;
};

// 画面サイズに応じて値を返すヘルパーフック
export const useResponsiveValue = <T>(values: {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined => {
  const { breakpoints } = useResponsive();

  // 大きいブレークポイントから順に確認
  if (breakpoints['2xl'] && values['2xl'] !== undefined) return values['2xl'];
  if (breakpoints.xl && values.xl !== undefined) return values.xl;
  if (breakpoints.lg && values.lg !== undefined) return values.lg;
  if (breakpoints.md && values.md !== undefined) return values.md;
  if (breakpoints.sm && values.sm !== undefined) return values.sm;
  
  return values.base;
};

// タッチデバイスかどうかを判定
export const useTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
    
    return () => window.removeEventListener('touchstart', checkTouch);
  }, []);

  return isTouch;
};