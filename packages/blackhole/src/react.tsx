'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import { mountBlackHole, type BlackHoleController, type BlackHoleOptions } from './index';
export type { BlackHoleOptions, BlackHoleCamera, BlackHoleController } from './index';
export type BlackHoleProps = BlackHoleOptions & { style?: CSSProperties };
export function BlackHole({className, style, ...options}: BlackHoleProps) {
 const host = useRef<HTMLDivElement>(null);
 const controller = useRef<BlackHoleController | null>(null);
 const previous = useRef(options);
 useEffect(() => {
  if (!host.current) return;
  controller.current = mountBlackHole(host.current, previous.current);
  return () => { controller.current?.dispose(); controller.current = null; };
 }, []);
 useEffect(() => {
  const changed: Partial<BlackHoleOptions> = {};
  for (const key of new Set([...Object.keys(previous.current), ...Object.keys(options)])) {
   if (!Object.is(previous.current[key as keyof typeof options], options[key as keyof typeof options])) Object.assign(changed,{[key]:options[key as keyof typeof options]});
  }
  if (Object.keys(changed).length) controller.current?.update(changed);
  previous.current = options;
 });
 return <div ref={host} className={className} style={{position:'relative',width:'100%',height:'100%',background:'black',...style}} />;
}
