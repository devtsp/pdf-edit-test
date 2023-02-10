const { pdfToPng } = require('pdf-to-png-converter');
const path = require('path');

const { db } = require('./db');

async function getOptDocuments(req, res) {
	const result = db.get('optDocuments', req.query.id);
	const pngAttachments = await Promise.all(
		result.map(async (doc) => {
			const pngPages = await pdfToPng(
				path.join(__dirname, 'public', 'documents', 'to_sign', doc.DocumentName)
			);
			const attached = { ...doc, pngPages };
			return attached;
		})
	);
	res.json(pngAttachments);
}

module.exports = { getOptDocuments };
