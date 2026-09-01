import type { CSSProperties } from 'react';
import type { WebsiteSettings } from './website.api';

function foregroundFor(hex: string) {
  const normalized = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) =>
    Number.parseInt(normalized.slice(index, index + 2), 16),
  );
  const luminance = channels.reduce(
    (sum, channel, index) => sum + channel * [0.299, 0.587, 0.114][index]!,
    0,
  );
  return luminance > 150 ? '#241316' : '#FFF9ED';
}

const fontStack = (font: string) =>
  font === 'Merriweather'
    ? `'Merriweather', Georgia, serif`
    : `'${font}', ui-sans-serif, system-ui, sans-serif`;

export function websiteTheme(settings: WebsiteSettings): CSSProperties {
  return {
    '--website-primary': settings.primaryColor,
    '--website-primary-foreground': foregroundFor(settings.primaryColor),
    '--website-secondary': settings.secondaryColor,
    '--website-secondary-foreground': foregroundFor(settings.secondaryColor),
    '--website-accent': settings.accentColor,
    '--website-accent-foreground': foregroundFor(settings.accentColor),
    '--website-heading-font': fontStack(settings.headingFont || 'Merriweather'),
    '--website-body-font': fontStack(settings.bodyFont || 'Inter'),
  } as CSSProperties;
}
