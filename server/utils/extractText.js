import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import fs from 'fs';

/**
 * Extract text from a file.
 * Supports both:
 *  - Disk storage: file has a `path` property (legacy / local fallback)
 *  - Memory storage: file has a `buffer` property (used when uploading to S3)
 */
export const extractText = async (file) => {
    try {
        // Prefer buffer (memory storage) over file path (disk storage)
        const buffer = file.buffer ?? (file.path ? fs.readFileSync(file.path) : null);
        if (!buffer) throw new Error('No file data available');

        if (file.mimetype === 'application/pdf') {
            const data = await pdf(buffer);
            return data.text;
        }
        else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        else if (file.mimetype === 'text/plain') {
            return buffer.toString('utf8');
        }
        else {
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Text Extraction Error:', error);
        throw error;
    }
};
