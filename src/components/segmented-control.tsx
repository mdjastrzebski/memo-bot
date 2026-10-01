import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '../lib/utils';

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  onValueChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as T)}
      className={cn(
        'grid gap-1 rounded-[1.25rem] border border-black/10 bg-white/60 p-1 sm:p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] dark:border-white/10 dark:bg-white/5 dark:shadow-none',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className="rounded-[0.95rem] px-1.5 py-2.5 text-sm font-extrabold leading-tight sm:px-2 sm:py-3 sm:text-base text-[#6a503b] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#de5a37] data-[state=checked]:bg-[#de5a37] data-[state=checked]:text-white data-[state=checked]:shadow-[0_6px_14px_rgba(222,90,55,0.28)] dark:text-[#d4c5b3] dark:hover:bg-white/10 dark:data-[state=checked]:bg-[#d46b47] dark:data-[state=checked]:text-white dark:data-[state=checked]:shadow-none"
        >
          {option.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
