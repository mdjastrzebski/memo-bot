import { diffChars } from 'diff';

export type WordDiffProps = {
  expected: string;
  actual: string;
};

export function WordDiff({ expected, actual }: WordDiffProps) {
  const differences = diffChars(actual, expected);
  return (
    <div className="space-y-4 font-mono text-xl tracking-wider">
      <div className="text-green-400 text-3xl">{expected}</div>

      {expected !== actual && (
        <div>
          {differences.map((part, index) => {
            // Extra letters typed by user (wrong)
            if (part.removed) {
              return (
                <span key={index} className="text-red-500 line-through opacity-70">
                  {part.value}
                </span>
              );
            }

            // Missing letters (wrong)
            if (part.added) {
              return (
                <span key={index} className="text-yellow-400">
                  {part.value}
                </span>
              );
            }

            // Matching letters (correct)
            return (
              <span key={index} className="text-green-500">
                {part.value}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
