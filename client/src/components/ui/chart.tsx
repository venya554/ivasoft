import React from 'react';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<string, { color: string; label: string }>;

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChartContainer({ children, className, ...props }: ChartContainerProps) {
  return (
    <div className={cn("rounded-md border bg-background p-6", className)} {...props}>
      {children}
    </div>
  );
}

export interface ChartHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChartHeader({ children, className, ...props }: ChartHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export interface ChartTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function ChartTitle({ children, className, ...props }: ChartTitleProps) {
  return (
    <h3 className={cn("font-semibold text-lg", className)} {...props}>
      {children}
    </h3>
  );
}

export interface ChartDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function ChartDescription({ children, className, ...props }: ChartDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export interface ChartContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChartContent({ children, className, ...props }: ChartContentProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  items: { label: string; color: string }[];
}

export function ChartLegend({ items, className, ...props }: ChartLegendProps) {
  return (
    <div className={cn("flex items-center gap-4 mt-4", className)} {...props}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ChartTooltip({ children, className, ...props }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2 shadow-sm text-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}