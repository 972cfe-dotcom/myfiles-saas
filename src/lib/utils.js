import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDate, isValid } from "date-fns"
import { he } from "date-fns/locale"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parses a date value and returns a valid Date object or null
 * @param {string|Date|number} dateValue - The date value to parse
 * @returns {Date|null} - Valid Date object or null if invalid
 */
export function safeDateParse(dateValue) {
  if (!dateValue) return null
  
  try {
    let date
    
    if (dateValue instanceof Date) {
      date = dateValue
    } else if (typeof dateValue === 'string') {
      // Handle various date formats that might come from the database
      date = new Date(dateValue)
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue)
    } else {
      return null
    }
    
    // Check if the resulting date is valid
    if (isValid(date) && !isNaN(date.getTime())) {
      return date
    }
    
    return null
  } catch (error) {
    console.warn('Date parsing error:', error, 'for value:', dateValue)
    return null
  }
}

/**
 * Safely formats a date with fallback to default text
 * @param {string|Date|number} dateValue - The date value to format
 * @param {string} formatStr - date-fns format string
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} - Formatted date or fallback text
 */
export function safeFormatDate(dateValue, formatStr = 'dd/MM/yy', fallback = 'תאריך לא זמין') {
  const date = safeDateParse(dateValue)
  
  if (!date) {
    return fallback
  }
  
  try {
    return formatDate(date, formatStr, { locale: he })
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', date)
    return fallback
  }
}

/**
 * Gets a safe date for document display (tries multiple common field names)
 * @param {object} document - Document object that might have various date field names
 * @returns {Date|null} - Valid Date object or null
 */
export function getDocumentDate(document) {
  // Try common date field names that might be used
  const dateFields = [
    'created_date',
    'created_at', 
    'createdAt',
    'date_created',
    'dateCreated',
    'upload_date',
    'uploadDate'
  ]
  
  for (const field of dateFields) {
    if (document[field]) {
      const parsedDate = safeDateParse(document[field])
      if (parsedDate) {
        return parsedDate
      }
    }
  }
  
  return null
} 