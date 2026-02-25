import { FlagSuggester } from '../../src/cli/FlagSuggester';

describe('FlagSuggester', () => {
  let suggester: FlagSuggester;

  beforeEach(() => {
    suggester = new FlagSuggester();
  });

  describe('suggest', () => {
    it('suggests --input for --inputt', () => {
      const result = suggester.suggest('--inputt');
      expect(result).toBe('--input');
    });

    it('suggests --output for --out (prefix match)', () => {
      const result = suggester.suggest('--out');
      expect(result).toBe('--output');
    });

    it('suggests --config for --conf (prefix match)', () => {
      const result = suggester.suggest('--conf');
      expect(result).toBe('--config');
    });

    it('suggests --verbose for --verbos', () => {
      const result = suggester.suggest('--verbos');
      expect(result).toBe('--verbose');
    });

    it('suggests --strict for --stric', () => {
      const result = suggester.suggest('--stric');
      expect(result).toBe('--strict');
    });

    it('suggests --help for --hel (prefix match)', () => {
      const result = suggester.suggest('--hel');
      expect(result).toBe('--help');
    });

    it('suggests --interactive for --interactiv', () => {
      const result = suggester.suggest('--interactiv');
      expect(result).toBe('--interactive');
    });

    it('suggests --init for --ini (prefix match)', () => {
      const result = suggester.suggest('--ini');
      expect(result).toBe('--init');
    });

    it('returns null for completely unknown flags', () => {
      const result = suggester.suggest('--xyzabc');
      expect(result).toBeNull();
    });

    it('returns null for empty input', () => {
      const result = suggester.suggest('');
      expect(result).toBeNull();
    });

    it('returns null for short flags with wrong case (-I)', () => {
      const result = suggester.suggest('-I');
      expect(result).toBeNull();
    });

    it('returns null when distance exceeds maxDistance', () => {
      const result = suggester.suggest('--inputttttttt');
      expect(result).toBeNull();
    });

    it('returns null when confidence is below threshold', () => {
      const result = suggester.suggest('--xyzinput');
      expect(result).toBeNull();
    });
  });

  describe('formatSuggestion', () => {
    it('formats suggestion message correctly', () => {
      const message = suggester.formatSuggestion('--inputt', '--input');
      expect(message).toBe('⚠️  Unknown option "--inputt". Did you mean "--input"?');
    });
  });

  describe('getSuggestionMessage', () => {
    it('returns formatted message when suggestion exists', () => {
      const message = suggester.getSuggestionMessage('--inputt');
      expect(message).toBe('⚠️  Unknown option "--inputt". Did you mean "--input"?');
    });

    it('returns null when no suggestion exists', () => {
      const message = suggester.getSuggestionMessage('--xyzabc');
      expect(message).toBeNull();
    });
  });

  describe('performance requirements', () => {
    it('returns suggestions within 50ms for 100 calls', () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        suggester.suggest('--inputt');
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('no false positives', () => {
    it('does not suggest for flags that are too different', () => {
      const result = suggester.suggest('--completely-different');
      expect(result).toBeNull();
    });

    it('does not suggest for random strings', () => {
      const result = suggester.suggest('--asdfghjkl');
      expect(result).toBeNull();
    });

    it('does not match when multiple flags share prefix (--i)', () => {
      const result = suggester.suggest('--i');
      expect(result).toBeNull();
    });
  });
});