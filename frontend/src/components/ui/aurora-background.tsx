"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
  fullScreen?: boolean;
  centered?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  fullScreen = true,
  centered = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div className="h-full w-full">
      <div
        className={cn(
          "transition-bg relative bg-transparent",
          fullScreen ? "flex h-[100vh] flex-col" : "w-full h-full",
          centered && "items-center justify-center",
          className,
        )}
        {...props}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={
            {
              // Dark, close-step aurora bands
              "--aurora": "repeating-linear-gradient(110deg,#0b0e11_8%,#12161b_10%,#1a1f26_12%,#232a33_14%,#4a4f57_16%)",
              "--dark-gradient": "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
              "--white-gradient": "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
            } as React.CSSProperties
          }
        >
          <div
            className={cn(
              `after:animate-aurora pointer-events-none absolute -inset-[10px]
               [background-image:var(--white-gradient),var(--aurora)]
               [background-size:260%,_220%]
               [background-position:50%_50%,50%_50%]
               opacity-80 blur-[20px] filter will-change-transform
               [--aurora:repeating-linear-gradient(110deg,#0b0e11_8%,#12161b_10%,#1a1f26_12%,#232a33_14%,#4a4f57_16%)]
               [--dark-gradient:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)]
               [--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]
               after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)]
               after:[background-size:220%,_120%] after:[background-attachment:fixed]
               after:mix-blend-difference after:content-[""]
               dark:[background-image:var(--dark-gradient),var(--aurora)]
               after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,

              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]`,
            )}
          ></div>
        </div>
        {children}
      </div>
    </div>
  );
};
