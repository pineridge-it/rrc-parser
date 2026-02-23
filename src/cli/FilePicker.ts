import * as fs from 'fs';
import * as path from 'path';
// Use dynamic import for enquirer or require
const { AutoComplete, Input, Confirm } = require('enquirer');
import { PreferenceStore } from './PreferenceStore';

export interface PickOptions {
  message?: string;
  suggestedOutput?: string;
}

export class FilePicker {
  private prefs: PreferenceStore;

  constructor(prefs: PreferenceStore) {
    this.prefs = prefs;
  }

  async pickFile(options?: PickOptions): Promise<string> {
    const recent = this.prefs.load().recentFiles || [];
    
    const datFiles = this.findDatFiles(process.cwd(), 2);

    const allFiles = Array.from(new Set(recent.concat(datFiles)));
    
    if (allFiles.length === 0) {
      // Fallback to manual entry if no files found
      const prompt = new Input({
        name: 'filepath',
        message: 'Could not find any .dat files. Enter path manually:'
      });
      return await prompt.run();
    }

    const { formatStats } = this;
    const choices = allFiles.map(file => {
      let extra = '';
      try {
        const stats = fs.statSync(file);
        extra = ` (${formatStats(stats)})`;
      } catch (e) {}
      
      const isRecent = recent.includes(file);
      return {
        name: file,
        message: `${file}${isRecent ? ' [Recent]' : ''}${extra}`,
        value: file
      };
    });

    const prompt = new AutoComplete({
      name: 'file',
      message: options?.message || 'Select input file',
      limit: 10,
      initial: 0,
      choices: [
        ...choices,
        { name: '__manual__', message: '[Type path manually...]', value: '__manual__' }
      ]
    });

    const answer = await prompt.run();
    
    if (answer === '__manual__') {
      const manualPrompt = new Input({
        message: 'Enter file path:',
        initial: this.prefs.load().lastInput || ''
      });
      return await manualPrompt.run();
    }

    return answer;
  }
  
  async pickOutput(suggestedOutput: string): Promise<string> {
    const prompt = new Input({
      message: 'Output location >',
      initial: suggestedOutput
    });
    return await prompt.run();
  }

  async askConfirmation(message: string, initial: boolean = false): Promise<boolean> {
      const prompt = new Confirm({
          message,
          initial
      });
      return await prompt.run();
  }

  private findDatFiles(dir: string, depth: number, currentDepth = 0): string[] {
    if (currentDepth > depth) return [];
    
    let results: string[] = [];
    try {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        if (item.startsWith('node_modules') || item.startsWith('.')) continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          results = results.concat(this.findDatFiles(fullPath, depth, currentDepth + 1));
        } else if (item.endsWith('.dat')) {
          results.push(fullPath);
        }
      }
    } catch (e) {
      // Ignore read errors
    }
    return results;
  }
  
  private formatStats(stats: fs.Stats): string {
    const mb = stats.size / (1024 * 1024);
    const sizeStr = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(stats.size / 1024)} KB`;
    
    const diffHours = Math.round((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60));
    let timeStr = '';
    if (diffHours < 24) timeStr = diffHours <= 1 ? 'recently' : `${diffHours} hours ago`;
    else if (diffHours < 48) timeStr = 'yesterday';
    else timeStr = `${Math.round(diffHours / 24)} days ago`;
    
    return `${sizeStr}, modified ${timeStr}`;
  }
}
