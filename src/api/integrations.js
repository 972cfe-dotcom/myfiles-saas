// Mock integrations for standalone app
export const Core = {
  // Mock core functionality
};

// Mock file upload functionality 
export const UploadFile = async (file) => {
  // Validate file input
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided');
  }
  
  // Create object URL safely
  let fileUrl;
  try {
    fileUrl = URL.createObjectURL(file);
  } catch (error) {
    console.warn('Could not create object URL, using placeholder:', error);
    fileUrl = '/placeholder-file.png'; // Fallback URL
  }
  
  // Return mock upload result
  return {
    id: Date.now().toString(),
    file_name: file.name,
    size: file.size,
    file_type: file.type,
    url: fileUrl,
    created_at: new Date().toISOString()
  };
};

// Mock data extraction
export const ExtractDataFromUploadedFile = async (params) => {
  // Mock extraction based on file URL or file name
  const fileName = params.file_url ? 'קובץ מועלה' : (params.file_name || 'קובץ לא ידוע');
  
  // Mock extraction - return basic file info with proper structure
  return {
    status: "success",
    output: {
      extracted_text: `טקסט מחולץ מהקובץ ${fileName}. זהו תוכן לדוגמה שמדמה חילוץ טקסט מקובץ PDF או תמונה.`,
      document_type: "other",
      organization: "חברה לדוגמה בע״מ",
      amounts: [1500, 2000, 350],
      dates: ["2024-09-26", "2024-09-20", "2024-09-15"]
    },
    metadata: {
      pages: 1,
      words: 100,
      characters: 500,
      confidence: 0.95
    }
  };
};

// Mock AI LLM integration
export const InvokeLLM = async (prompt) => {
  // Mock AI response with realistic tagging suggestions
  if (prompt.includes('tags') || prompt.includes('תגיות')) {
    return { 
      response: JSON.stringify({
        suggested_tags: ['מסמך חשוב', 'כספים', 'דוח', '2024'],
        document_type: 'invoice',
        confidence: 0.85,
        summary: 'מסמך כספי המכיל פרטי חשבונות ודוחות'
      })
    };
  }
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






