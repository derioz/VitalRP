import React from 'react';
type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | { src: string } | { default: { src: string } };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
};
export default function NextImage({ src, fill, priority, quality, unoptimized, placeholder, blurDataURL, loader, style, ...props }: Props) {
  const url = typeof src === 'string' ? src : 'default' in src ? src.default.src : src.src;
  return <img {...props} src={url} loading={priority ? 'eager' : props.loading || 'lazy'} style={{ ...(fill ? { position:'absolute', height:'100%', width:'100%', inset:0 } : {}), ...style }} />;
}
