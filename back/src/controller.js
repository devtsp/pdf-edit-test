const { db } = require('./db');

async function getOptDocuments(req, res) {
	const result = db.get('optDocuments', req.query.id);
	res.json(result);
}

module.exports = { getOptDocuments };
