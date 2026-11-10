declare module "@/components/ReactBitsBlurText" {
  import type { ComponentType } from "react";

  const BlurText: ComponentType<{
    text: string;
    tag?: "span" | "p";
    animateBy?: "words" | "chars";
    effect?: string;
    direction?: string;
    delay?: number;
    stepDuration?: number;
    distance?: number;
    blur?: number;
    trigger?: string;
    className?: string;
  }>;

  export default BlurText;
}

declare module "@/components/ReactBitsDotField" {
  import type { ComponentType, CSSProperties } from "react";

  const DotField: ComponentType<{
    className?: string;
    style?: CSSProperties;
    gradientFrom?: string;
    gradientTo?: string;
    dotRadius?: number;
    dotSpacing?: number;
    cursorRadius?: number;
    bulgeStrength?: number;
    glowRadius?: number;
    pattern?: "grid" | "hex" | "spiral" | "scatter";
    baseOpacity?: number;
    opacity?: number;
    waveAmplitude?: number;
    speed?: number;
    sparkle?: boolean;
    interactive?: boolean;
    intro?: boolean;
    lightMode?: boolean;
  }>;

  export default DotField;
}
