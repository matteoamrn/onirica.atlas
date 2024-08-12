import { Dream } from './Dream';

export class DreamManager {
  private dreams: Map<number, Dream>;

  constructor(dreams: Map<number, Dream>) {
    this.dreams = dreams;
  }

  getDream(id: number): Dream | undefined {
    return this.dreams.get(id);
  }

  getAllDreams(): Dream[] {
    return Array.from(this.dreams.values());
  }

  async searchDreams(word: string): Promise<number[]> {
    const indices: number[] = [];
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${this.sanitizeString(word)}($|[^\\p{L}\\p{N}])`, 'u');
    this.dreams.forEach((dream, index) => {
      if (regex.test(this.sanitizeString(dream.getReport()))) {
        indices.push(index);
      }
    });
    return indices;
  }

  private sanitizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
