// Mock integrations for standalone app
export const Core = {
  // Mock core functionality
};

// Mock file upload functionality 
export const UploadFile = async (file) => {
  // Return mock upload result
  return {
    id: Date.now().toString(),
    file_name: file.name,
    size: file.size,
    file_type: file.type,
    url: URL.createObjectURL(file), // Create local URL for preview
    created_at: new Date().toISOString()
  };
};

// Mock data extraction
export const ExtractDataFromUploadedFile = async (fileData) => {
  // Mock extraction - return basic file info
  return {
    content: `תוכן מחולץ מ-${fileData.file_name}`,
    text: `טקסט מחולץ מהקובץ ${fileData.file_name}`,
    metadata: {
      pages: 1,
      words: 100,
      characters: 500
    }
  };
};

// Mock other integrations
export const InvokeLLM = async (prompt) => {
  return { response: "תגובה מדומה מ-AI" };
};

export const SendEmail = async (data) => {
  console.log('Mock email sent:', data);
  return { success: true };
};

export const GenerateImage = async (prompt) => {
  return { url: "/api/mock-image.jpg" };
};

export const CreateFileSignedUrl = async (fileId) => {
  return { url: `#file-${fileId}` };
};

export const UploadPrivateFile = UploadFile;






