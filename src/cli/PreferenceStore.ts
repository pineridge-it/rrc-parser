import * as fs from 'fs';
import * as path from 'path';

export interface Preferences {
  lastInput?: string;
  lastOutput?: string;
  recentFiles: string[];
  preferences: {
    verbose: boolean;
    strictMode: boolean;
  };
  templates: Record<string, { input: string; output: string }>;
}

export class PreferenceStore {
  private configPath: string;
  private data: Preferences;

  constructor() {
    // Determine path for .parserrc, usually in home directory or current project root
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    this.configPath = path.join(homeDir, '.parserrc');
    this.data = this.getDefaults();
    this.load();
  }

  private getDefaults(): Preferences {
    return {
      recentFiles: [],
      preferences: {
        verbose: false,
        strictMode: false
      },
      templates: {}
    };
  }

  load(): Preferences {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.data = { ...this.getDefaults(), ...parsed };
      }
    } catch (e) {
      console.error('Failed to load preferences from .parserrc');
    }
    return this.data;
  }

  save(prefs?: Partial<Preferences>): void {
    if (prefs) {
      this.data = { ...this.data, ...prefs };
    }
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save preferences to .parserrc');
    }
  }

  getLastUsed(key: keyof Preferences): any {
    return this.data[key];
  }

  addRecentFile(filePath: string): void {
    const fullPath = path.resolve(filePath);
    // Remove if already exists to put it at the top
    const filtered = this.data.recentFiles.filter(p => p !== fullPath);
    filtered.unshift(fullPath);
    // Keep max 10
    this.data.recentFiles = filtered.slice(0, 10);
    this.data.lastInput = fullPath;
    this.save();
  }

  setLastOutput(filePath: string): void {
    this.data.lastOutput = path.resolve(filePath);
    this.save();
  }
}
