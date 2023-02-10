const { db } = require('./db');

async function getPdfInfo(req, res) {
	const pdfSelected = db.getById('BlankDocuments', req.params.pdfId);
	res.json(pdfSelected);
}

async function postPdfFields(req, res) {
	res.json('Attempted to post a pdf acro-form!');
}

module.exports = { getPdfInfo, postPdfFields };
