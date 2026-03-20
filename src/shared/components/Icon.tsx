import type { CSSProperties } from "react";

type IconProps = { name: string; className?: string; style?: CSSProperties };

const Icon = ({ name, className = "", style }: IconProps) => (
  <span
    className={`material-symbols-outlined ${className}`.trim()}
    style={{ fontFamily: "'Material Symbols Outlined'", ...style }}
  >
    {name}
  </span>
);

export default Icon;
