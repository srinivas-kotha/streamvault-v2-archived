import type { ReactNode } from 'react';
import { useDeviceContext } from '@/hooks/useDeviceContext';
import { TVLayout } from './TVLayout';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';

interface LayoutSelectorProps {
  children: ReactNode;
}

/**
 * Selects the appropriate layout based on device type.
 * - firetv, tizen, webos -> TVLayout
 * - desktop -> DesktopLayout
 * - mobile -> MobileLayout
 *
 * BANNED: No CSS transform on wrapper element (AC-01).
 */
export function LayoutSelector({ children }: LayoutSelectorProps) {
  const { deviceType } = useDeviceContext();

  switch (deviceType) {
    case 'firetv':
    case 'tizen':
    case 'webos':
      return <TVLayout>{children}</TVLayout>;
    case 'mobile':
      return <MobileLayout>{children}</MobileLayout>;
    case 'desktop':
    default:
      return <DesktopLayout>{children}</DesktopLayout>;
  }
}
