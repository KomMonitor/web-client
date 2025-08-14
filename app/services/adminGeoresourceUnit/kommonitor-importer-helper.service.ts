import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class KommonitorImporterHelperService {

  constructor(private http: HttpClient) {}

  /**
   * Parse CSV file content
   */
  parseCsvFile(fileContent: string): any[] {
    try {
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map((header: string) => header.trim());
      const data: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((value: string) => value.trim());
          const row: any = {};
          
          headers.forEach((header: string, index: number) => {
            row[header] = values[index] || '';
          });
          
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      return [];
    }
  }

  /**
   * Parse JSON file content
   */
  parseJsonFile(fileContent: string): any {
    try {
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      return null;
    }
  }

  /**
   * Validate file format
   */
  validateFileFormat(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type) || 
           allowedTypes.some(type => file.name.endsWith(type));
  }

  /**
   * Get file extension
   */
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:application/...;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Download file from URL
   */
  async downloadFileFromUrl(url: string): Promise<Blob> {
    try {
      const response = await this.http.get(url, { responseType: 'blob' }).toPromise();
      return response as Blob;
    } catch (error) {
      console.error('Error downloading file from URL:', error);
      throw error;
    }
  }

  /**
   * Validate georesource data structure
   */
  validateGeoresourceData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.georesourceId) {
      errors.push('Missing georesourceId');
    }
    
    if (!data.datasetName) {
      errors.push('Missing datasetName');
    }
    
    if (!data.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!data.metadata.description) {
        errors.push('Missing metadata.description');
      }
      if (!data.metadata.datasource) {
        errors.push('Missing metadata.datasource');
      }
      if (!data.metadata.contact) {
        errors.push('Missing metadata.contact');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform data to georesource format
   */
  transformToGeoresourceFormat(rawData: any): any {
    return {
      georesourceId: rawData.georesourceId || rawData.id,
      datasetName: rawData.datasetName || rawData.name,
      isPOI: rawData.isPOI || false,
      isLOI: rawData.isLOI || false,
      isAOI: rawData.isAOI || false,
      poiSymbolColor: rawData.poiSymbolColor || '#000000',
      poiSymbolBootstrap3Name: rawData.poiSymbolBootstrap3Name || 'default',
      poiMarkerColor: rawData.poiMarkerColor || '#000000',
      loiColor: rawData.loiColor || '#000000',
      loiWidth: rawData.loiWidth || 2,
      loiDashArrayString: rawData.loiDashArrayString || '5,5',
      aoiColor: rawData.aoiColor || '#000000',
      metadata: {
        description: rawData.description || rawData.metadata?.description || '',
        datasource: rawData.datasource || rawData.metadata?.datasource || '',
        contact: rawData.contact || rawData.metadata?.contact || ''
      },
      availablePeriodsOfValidity: rawData.availablePeriodsOfValidity || [],
      topicReference: rawData.topicReference || null,
      permissions: rawData.permissions || [],
      isPublic: rawData.isPublic || false,
      ownerId: rawData.ownerId || ''
    };
  }

  /**
   * Generate sample georesource template
   */
  generateSampleTemplate(): any {
    return {
      georesourceId: 'sample-id',
      datasetName: 'Sample Dataset',
      isPOI: true,
      isLOI: false,
      isAOI: false,
      poiSymbolColor: '#FF0000',
      poiSymbolBootstrap3Name: 'map-marker',
      poiMarkerColor: '#FF0000',
      metadata: {
        description: 'Sample description',
        datasource: 'Sample datasource',
        contact: 'sample@example.com'
      },
      availablePeriodsOfValidity: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      ],
      topicReference: null,
      permissions: [],
      isPublic: true,
      ownerId: 'sample-owner'
    };
  }

  // Available converters for the template
  availableConverters = [
    { name: 'csv-converter', displayName: 'CSV Converter', description: 'Convert CSV files to georesource format' },
    { name: 'json-converter', displayName: 'JSON Converter', description: 'Convert JSON files to georesource format' },
    { name: 'xml-converter', displayName: 'XML Converter', description: 'Convert XML files to georesource format' }
  ];

  // Available datasource types for the template
  availableDatasourceTypes = [
    { type: 'file', name: 'File Upload', description: 'Upload a file from your computer' },
    { type: 'http', name: 'HTTP URL', description: 'Download from a web URL' },
    { type: 'inline', name: 'Inline Data', description: 'Paste data directly' }
  ];
}
