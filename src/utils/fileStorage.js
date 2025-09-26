// Real file storage system using IndexedDB and FileReader API
class FileStorageManager {
  constructor() {
    this.dbName = 'myfiles_storage';
    this.dbVersion = 1;
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create files store
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('created_at', 'created_at', { unique: false });
        }
        
        // Create file_data store for binary data
        if (!db.objectStoreNames.contains('file_data')) {
          db.createObjectStore('file_data', { keyPath: 'file_id' });
        }
      };
    });
  }

  async ensureDBReady() {
    if (!this.db) {
      await this.initDB();
    }
  }

  // Store file with binary data
  async storeFile(file) {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const fileId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
          const fileInfo = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            created_at: new Date().toISOString(),
            lastModified: file.lastModified || Date.now()
          };
          
          const fileData = {
            file_id: fileId,
            data: reader.result // This is the ArrayBuffer
          };
          
          const transaction = this.db.transaction(['files', 'file_data'], 'readwrite');
          
          // Store file metadata
          const filesStore = transaction.objectStore('files');
          filesStore.add(fileInfo);
          
          // Store file binary data
          const fileDataStore = transaction.objectStore('file_data');
          fileDataStore.add(fileData);
          
          transaction.oncomplete = () => {
            resolve({
              ...fileInfo,
              url: `indexeddb://${fileId}`, // Custom URL scheme
              blob: new Blob([reader.result], { type: file.type })
            });
          };
          
          transaction.onerror = () => {
            reject(transaction.error);
          };
          
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(reader.error);
      };
      
      // Read file as ArrayBuffer for binary storage
      reader.readAsArrayBuffer(file);
    });
  }

  // Retrieve file data as blob
  async getFileBlob(fileId) {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files', 'file_data'], 'readonly');
      const filesStore = transaction.objectStore('files');
      const fileDataStore = transaction.objectStore('file_data');
      
      // Get file metadata
      const fileRequest = filesStore.get(fileId);
      fileRequest.onsuccess = () => {
        const fileInfo = fileRequest.result;
        if (!fileInfo) {
          reject(new Error('File not found'));
          return;
        }
        
        // Get file binary data
        const dataRequest = fileDataStore.get(fileId);
        dataRequest.onsuccess = () => {
          const fileData = dataRequest.result;
          if (!fileData) {
            reject(new Error('File data not found'));
            return;
          }
          
          const blob = new Blob([fileData.data], { type: fileInfo.type });
          resolve({
            ...fileInfo,
            blob,
            url: URL.createObjectURL(blob)
          });
        };
        
        dataRequest.onerror = () => {
          reject(dataRequest.error);
        };
      };
      
      fileRequest.onerror = () => {
        reject(fileRequest.error);
      };
    });
  }

  // Get all stored files
  async getAllFiles() {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete file
  async deleteFile(fileId) {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['files', 'file_data'], 'readwrite');
      const filesStore = transaction.objectStore('files');
      const fileDataStore = transaction.objectStore('file_data');
      
      filesStore.delete(fileId);
      fileDataStore.delete(fileId);
      
      transaction.oncomplete = () => {
        resolve(true);
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  // Extract text from PDF
  async extractTextFromPDF(fileId) {
    try {
      const fileData = await this.getFileBlob(fileId);
      
      if (fileData.blob.type !== 'application/pdf') {
        throw new Error('File is not a PDF');
      }
      
      // Use PDF.js to extract text
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      
      const arrayBuffer = await fileData.blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return {
        text: fullText,
        pages: numPages,
        words: fullText.split(/\s+/).length,
        characters: fullText.length
      };
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return {
        text: `שגיאה בחילוץ טקסט מ-PDF: ${error.message}`,
        pages: 0,
        words: 0,
        characters: 0
      };
    }
  }
}

export const fileStorage = new FileStorageManager();