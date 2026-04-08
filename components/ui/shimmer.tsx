"use client";

import { cn } from "@/lib/utils";
import React from "react";

type ShimmerProps<T extends React.ElementType = "span"> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Shimmer<T extends React.ElementType = "span">({
  as,
  children,
  className,
  ...props
}: ShimmerProps<T>) {
  const Tag = (as ?? "span") as React.ElementType;
  return (
    <Tag
      className={cn(
        "inline-block bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
