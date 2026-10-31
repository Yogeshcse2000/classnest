// Admin API routes for batches. Mounted at /api/admin/batches (admins only).

const express = require('express');
const {
  listBatches,
  findBatchById,
  findBatchByName,
  createBatch,
  countBatchLinks,
  deleteBatch,
} = require('../../models/batches');
const { istToday } = require('../../utils/dates');

const router = express.Router();

// Trimmed text, or '' if the value isn't text
const text = (value) => (typeof value === 'string' ? value.trim() : '');

// "3 students", "1 lecture"
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// A real calendar date written as YYYY-MM-DD (so 2026-02-31 is rejected)
function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// What the browser receives. The server decides "started", so it always follows the server's clock.
function batchView(batch) {
  return { ...batch, started: batch.start_date <= istToday(Date.now()) };
}

// GET /api/admin/batches - all batches
router.get('/', async (req, res) => {
  const batches = await listBatches();
  res.json({ batches: batches.map(batchView) });
});

// POST /api/admin/batches  body: { name, startDate, description }
router.post('/', async (req, res) => {
  const body = req.body || {};
  const name = text(body.name);
  const startDate = text(body.startDate);
  const description = text(body.description);

  if (!name) {
    return res.status(400).json({ error: 'Please give the batch a name.' });
  }
  if (name.length > 80) {
    return res.status(400).json({ error: 'The batch name is too long (80 characters max).' });
  }
  if (!isValidDate(startDate)) {
    return res.status(400).json({ error: 'Please pick a start date.' });
  }
  if (description.length > 500) {
    return res.status(400).json({ error: 'The description is too long (500 characters max).' });
  }
  if (await findBatchByName(name)) {
    return res.status(409).json({ error: `A batch called "${name}" already exists. Please choose another name.` });
  }

  const id = await createBatch({ name, startDate, description: description || null });
  res.status(201).json({ batch: batchView(await findBatchById(id)) });
});

// DELETE /api/admin/batches/:id - only empty batches can be deleted, so nobody's data disappears by accident
router.delete('/:id', async (req, res) => {
  const batch = await findBatchById(Number(req.params.id));
  if (!batch) {
    return res.status(404).json({ error: 'That batch no longer exists.' });
  }

  const links = await countBatchLinks(batch.id);
  const stillInside = [];
  if (links.students) stillInside.push(plural(links.students, 'student'));
  if (links.lectures) stillInside.push(plural(links.lectures, 'lecture'));
  if (links.assignments) stillInside.push(plural(links.assignments, 'assignment'));

  if (stillInside.length) {
    return res.status(409).json({
      error: `"${batch.name}" still has ${stillInside.join(', ')}, so it can't be deleted. Only empty batches can be deleted.`,
    });
  }

  await deleteBatch(batch.id);
  res.json({ deleted: batch.id });
});

module.exports = router;
