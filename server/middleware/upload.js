// Receives one uploaded .zip and checks it. The file is held in memory until every check has passed, so a rejected
// or half-finished upload never reaches the disk and there is nothing to clean up. The size limit keeps the memory small.

const multer = require('multer');

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const TOO_BIG = 'That file is too big. The limit is 10 MB.';
const NOT_ZIP = 'Only .zip files can be uploaded. Please choose a .zip file.';
const LONGEST_NAME = 255;

// Every zip file starts with "PK" and two bytes saying what comes next: a file, an empty zip or a split zip.
// Checking all four means a text file that happens to start with the letters PK is still refused.
const ZIP_STARTS = ['PK\x03\x04', 'PK\x05\x06', 'PK\x07\x08'];

function isZip(contents) {
  return ZIP_STARTS.includes(contents.subarray(0, 4).toString('latin1'));
}

const receive = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1, fields: 0 },
  defParamCharset: 'utf8', // browsers send file names as UTF-8, so names like "होमवर्क.zip" stay readable
  fileFilter(req, file, accept) {
    if (file.originalname.toLowerCase().endsWith('.zip')) return accept(null, true);
    accept(Object.assign(new Error(NOT_ZIP), { badFile: true }));
  },
}).single('file');

// Puts the checked file in req.file. Anything wrong gets a clear message here, so it never reaches the general
// error handler in server.js, which only knows short, general messages.
function receiveZip(req, res, next) {
  receive(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: TOO_BIG });
    if (error?.badFile) return res.status(400).json({ error: NOT_ZIP });
    if (error) return res.status(400).json({ error: 'That upload could not be read. Please try again with one .zip file.' });

    if (!req.file) return res.status(400).json({ error: 'Please choose a .zip file to upload.' });
    if (!isZip(req.file.buffer)) {
      return res.status(400).json({ error: "That file isn't a real .zip file. Please make a new .zip and try again." });
    }

    // The name is only ever shown on a page. Control characters are removed, and the end of a long name is kept.
    req.file.originalname = req.file.originalname.replace(/[\x00-\x1f\x7f]/g, '').slice(-LONGEST_NAME);
    next();
  });
}

module.exports = { receiveZip };
