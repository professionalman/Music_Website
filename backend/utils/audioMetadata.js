const { parseFile } = require('music-metadata');
const fs = require('fs').promises;
const path = require('path');

/**
 * Extract cover art from audio file and save it
 * @param {string} audioFilePath - Absolute path to the audio file
 * @param {string} outputDir - Directory where to save the extracted cover
 * @returns {Promise<string|null>} - Returns the relative path to saved cover or null if not found
 */
async function extractCoverArt(audioFilePath, outputDir = 'public/img') {
    try {
        console.log('[EXTRACT COVER] Processing:', audioFilePath);
        
        // Parse audio file metadata
        const metadata = await parseFile(audioFilePath);
        
        // Check if cover art exists
        if (!metadata.common.picture || metadata.common.picture.length === 0) {
            console.log('[EXTRACT COVER] No embedded cover art found');
            return null;
        }

        // Get the first picture (usually the cover)
        const picture = metadata.common.picture[0];
        console.log('[EXTRACT COVER] Found cover art:', picture.format, picture.data.length, 'bytes');

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const extension = picture.format === 'image/png' ? 'png' : 'jpg';
        const filename = `cover-${timestamp}-${random}.${extension}`;
        
        // Ensure output directory exists
        const outputPath = path.join(outputDir, filename);
        await fs.mkdir(outputDir, { recursive: true });
        
        // Save cover art
        await fs.writeFile(outputPath, picture.data);
        console.log('[EXTRACT COVER] Saved to:', outputPath);
        
        // Return relative path for database
        return path.posix.join('img', filename);
    } catch (error) {
        console.error('[EXTRACT COVER] Error:', error.message);
        return null;
    }
}

/**
 * Extract metadata from audio file
 * @param {string} audioFilePath - Absolute path to the audio file
 * @returns {Promise<Object>} - Returns metadata object
 */
async function extractMetadata(audioFilePath) {
    try {
        const metadata = await parseFile(audioFilePath);
        
        return {
            title: metadata.common.title || null,
            artist: metadata.common.artist || null,
            album: metadata.common.album || null,
            year: metadata.common.year || null,
            duration: metadata.format.duration || null,
            hasCoverArt: metadata.common.picture && metadata.common.picture.length > 0
        };
    } catch (error) {
        console.error('[EXTRACT METADATA] Error:', error.message);
        return null;
    }
}

module.exports = {
    extractCoverArt,
    extractMetadata
};
