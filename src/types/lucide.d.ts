/** Module augmentation: lucide-react-native v1 derives icon props from
 *  react-native-svg's SvgProps, which resolves `color` through an internal
 *  ColorValue type that this TS setup can't satisfy. Augment to expose a plain
 *  string `color` (the supported runtime prop, alongside `size`/`strokeWidth`). */
declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
  }
}

export {};
