import { diffChars } from "diff"

interface WordDiffProps {
  expected: string
  actual: string
}

export function WordDiff({ expected, actual }: WordDiffProps) {
  const differences = diffChars(expected.toLowerCase(), actual.toLowerCase())

  // Calculate the number of incorrect characters
  const incorrectChars = differences.reduce((count, part) => {
    if (part.added || part.removed) {
      return count + part.value.length
    }
    return count
  }, 0)

  // If more than 50% of the characters are wrong, show simple comparison
  const shouldShowSimpleComparison = incorrectChars > expected.length * 0.5

  if (shouldShowSimpleComparison) {
    return (
      <div className="space-y-2 font-mono text-2xl tracking-wider">
        <div className="text-green-400">{expected}</div>
        <div className="text-red-400 opacity-80">{actual}</div>
      </div>
    )
  }

  // Otherwise show detailed character-by-character diff
  return (
    <div className="font-mono text-2xl tracking-wider">
      {differences.map((part, index) => {
        if (part.added) {
          // Extra letters typed by user (wrong)
          return (
            <span key={index} className="text-red-400 line-through">
              {part.value}
            </span>
          )
        }
        if (part.removed) {
          // Missing letters (wrong)
          return (
            <span key={index} className="text-red-400 opacity-50">
              {part.value}
            </span>
          )
        }
        // Matching letters (correct)
        return (
          <span key={index} className="text-green-400">
            {part.value}
          </span>
        )
      })}
    </div>
  )
}

