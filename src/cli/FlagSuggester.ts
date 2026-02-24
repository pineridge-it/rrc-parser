import * as levenshtein from 'fast-levenshtein';

export class FlagSuggester {
  private knownFlags = [
    '--input',
    '--output',
    '--config',
    '--strict',
    '--verbose',
    '--performance',
    '--validation-report',
    '--help',
    '--interactive',
    '--init',
    '-i',
    '-o',
    '-c',
    '-v',
    '-h',
    '-p',
  ];

  private maxDistance = 3;
  private minConfidence = 0.6;

  suggest(input: string): string | null {
    if (!input) return null;

    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    for (const knownFlag of this.knownFlags) {
      const distance = levenshtein.get(input, knownFlag);

      if (distance < bestDistance && distance <= this.maxDistance) {
        bestDistance = distance;
        bestMatch = knownFlag;
      }
    }

    if (bestMatch) {
      const maxLength = Math.max(input.length, bestMatch.length);
      const confidence = 1 - bestDistance / maxLength;

      if (confidence >= this.minConfidence) {
        return bestMatch;
      }
    }

    return null;
  }

  formatSuggestion(input: string, suggestion: string): string {
    return `⚠️  Unknown option "${input}". Did you mean "${suggestion}"?`;
  }

  getSuggestionMessage(input: string): string | null {
    const suggestion = this.suggest(input);
    if (suggestion) {
      return this.formatSuggestion(input, suggestion);
    }
    return null;
  }
}

export default FlagSuggester;
