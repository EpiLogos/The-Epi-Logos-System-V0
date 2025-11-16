"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
  fullScreen?: boolean;
  centered?: boolean;
  isLightMode?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  fullScreen = true,
  centered = true,
  isLightMode = false,
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
            isLightMode
              ? {
                  // Light mode - lighter blue-grey tones (blue-gray palette)
                  "--aurora": "repeating-linear-gradient(110deg,#f1f5f9_8%,#e2e8f0_10%,#cbd5e1_12%,#94a3b8_14%,#64748b_16%)",
                  "--dark-gradient": "repeating-linear-gradient(100deg,#f8fafc_0%,#f8fafc_7%,transparent_10%,transparent_12%,#f8fafc_16%)",
                  "--white-gradient": "repeating-linear-gradient(100deg,#94a3b8_0%,#94a3b8_7%,transparent_10%,transparent_12%,#94a3b8_16%)",
                } as React.CSSProperties
              : {
                  // Dark mode - original dark aurora bands
                  "--aurora": "repeating-linear-gradient(110deg,#0b0e11_8%,#12161b_10%,#1a1f26_12%,#232a33_14%,#4a4f57_16%)",
                  "--dark-gradient": "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
                  "--white-gradient": "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
                } as React.CSSProperties
          }
        >
          <div
            className={cn(
              `after:animate-aurora pointer-events-none absolute -inset-[10px]
               [background-size:260%,_220%]
               [background-position:50%_50%,50%_50%]
               opacity-80 blur-[20px] filter will-change-transform
               after:absolute after:inset-0
               after:[background-size:220%,_120%] after:[background-attachment:fixed]
               after:content-[""]`,
              isLightMode ? "after:mix-blend-normal" : "after:mix-blend-difference",
              isLightMode
                ? `[background-image:var(--dark-gradient),var(--aurora)]
                   [--aurora:repeating-linear-gradient(110deg,#f1f5f9_8%,#e2e8f0_10%,#cbd5e1_12%,#94a3b8_14%,#64748b_16%)]
                   [--dark-gradient:repeating-linear-gradient(100deg,#f8fafc_0%,#f8fafc_7%,transparent_10%,transparent_12%,#f8fafc_16%)]
                   [--white-gradient:repeating-linear-gradient(100deg,#94a3b8_0%,#94a3b8_7%,transparent_10%,transparent_12%,#94a3b8_16%)]
                   after:[background-image:var(--dark-gradient),var(--aurora)]`
                : `[background-image:var(--white-gradient),var(--aurora)]
                   [--aurora:repeating-linear-gradient(110deg,#0b0e11_8%,#12161b_10%,#1a1f26_12%,#232a33_14%,#4a4f57_16%)]
                   [--dark-gradient:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)]
                   [--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]
                   after:[background-image:var(--white-gradient),var(--aurora)]`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_center,black_10%,rgba(0,0,0,0.5)_50%,transparent_90%)]`,
            )}
          ></div>
        </div>
        {children}
      </div>
    </div>
  );
};
