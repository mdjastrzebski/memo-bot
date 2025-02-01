import { diffChars } from "diff";

interface WordDiffProps {
  expected: string;
  actual: string;
}

export function WordDiff({ expected, actual }: WordDiffProps) {
  const differences = diffChars(expected.toLowerCase(), actual.toLowerCase());
  return (
    <div className="space-y-2 font-mono text-2xl tracking-wider">
      <div className="text-green-400">{expected}</div>
      {expected.toLowerCase() !== actual.toLowerCase() && (
        <div>
          {differences.map((part, index) => {
            if (part.added) {
              // Extra letters typed by user (wrong)
              return (
                <span
                  key={index}
                  className="text-red-400 line-through opacity-50"
                >
                  {part.value}
                </span>
              );
            }
            if (part.removed) {
              // Missing letters (wrong)
              return (
                <span key={index} className="text-orange-300">
                  {part.value}
                </span>
              );
            }
            // Matching letters (correct)
            return (
              <span key={index} className="text-green-400">
                {part.value}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
