// Minimal stand-in for shadcn's usual clsx+tailwind-merge `cn()` helper -
// the lucide-animated icon components only ever pass through a single
// className, so plain filtering/joining is enough without adding two more
// dependencies just for class-conflict resolution we don't need here.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
