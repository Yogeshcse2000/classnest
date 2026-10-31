// All file handling lives here: save, delete and send uploaded files. Today they go in the uploads/ folder.
// When moving to online file storage, only this file changes.
// Files are only stored and sent back. Nothing here ever unzips or runs them.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Where the files live (uploads/ by default). The folder isn't inside public/, so no address can reach it directly.
const uploadsDir = path.resolve(__dirname, '..', process.env.UPLOADS_PATH || 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Saves a file under a random name and gives that name back. The student's own file name never goes near the path.
// The file is written under a temporary name first, so a write that fails halfway can never look like a finished file.
async function saveFile(contents) {
  const name = `${crypto.randomUUID()}.zip`;
  const fullPath = path.join(uploadsDir, name);
  const partPath = `${fullPath}.part`;
  try {
    await fs.promises.writeFile(partPath, contents);
    await fs.promises.rename(partPath, fullPath);
  } catch (error) {
    await fs.promises.rm(partPath, { force: true }).catch(() => {});
    throw error;
  }
  return name;
}

// Deletes a file. If that fails, the student's work is already safe, so the problem is logged and the request carries on.
async function deleteFile(name) {
  await fs.promises.rm(path.join(uploadsDir, name), { force: true }).catch((error) => console.error(error.stack));
}

// Sends a saved file as a download called downloadName. done(error) runs when it has finished.
function sendFile(res, name, downloadName, done) {
  res.download(name, downloadName, { root: uploadsDir }, done);
}

module.exports = { saveFile, deleteFile, sendFile };
