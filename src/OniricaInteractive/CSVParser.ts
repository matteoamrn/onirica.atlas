import * as THREE from 'three';
import Papa from 'papaparse';
import { Dream } from './Dream';

export class CSVParser {
  private scale: number;

  constructor(scale = 1) {
    this.scale = scale;
  }

  async parseCSV(csvData: string): Promise<Map<number, Dream>> {
    const dreams = new Map<number, Dream>();

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          result.data.forEach((row: any) => {
            const id = parseInt(row.id);
            const db = String(row.dataset)
            const x = parseFloat(row.x) * this.scale;
            const y = parseFloat(row.y) * this.scale;
            const z = parseFloat(row.z) * this.scale;
            const dreamReport = String(row.report);

            const dream = new Dream(id, db, x, y, z, dreamReport);
            dreams.set(id, dream);
          });

          resolve(dreams);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  }
}
