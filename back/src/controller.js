const { Poppler } = require('node-poppler');
const poppler = new Poppler();
const path = require('path');
const fs = require('fs');

const { db } = require('./db');

async function getOptDocuments(req, res) {
	const optDocuments = db.get('optDocuments', req.query.id);

	const optDocumentsWithPngPages = await Promise.all(
		optDocuments.map(async (optDocument) => {
			const OPT_DOCUMENT_FOLDER = path.join(
				__dirname,
				'public',
				'documents',
				'to_sign',
				optDocument.DocumentAlias
			);

			const PNG_PREVIEWS_FOLDER = path.join(OPT_DOCUMENT_FOLDER, 'png');
			// if png folder with previews doesn't exist, create the folder and the pngs
			if (!fs.existsSync(PNG_PREVIEWS_FOLDER)) {
				fs.mkdirSync(PNG_PREVIEWS_FOLDER);
				await poppler.pdfToCairo(
					path.join(OPT_DOCUMENT_FOLDER, 'pdf', optDocument.DocumentName),
					path.join(PNG_PREVIEWS_FOLDER, optDocument.DocumentName.split('.pdf')[0]),
					{ pngFile: true }
				);
			}

			// retrieve pngs as data uris base64 encoded
			const pngPreviews = fs
				.readdirSync(PNG_PREVIEWS_FOLDER)
				.map(
					(file) =>
						'data:image/png;base64,' +
						fs.readFileSync(path.join(PNG_PREVIEWS_FOLDER, file)).toString('base64')
				);

			return {
				...optDocument,
				pngPreviews,
				base64EncodedPdf:
					'data:application/pdf;base64,' +
					fs
						.readFileSync(path.join(OPT_DOCUMENT_FOLDER, 'pdf', optDocument.DocumentName))
						.toString('base64'),
			};
		})
	);
	res.json(optDocumentsWithPngPages);
}

module.exports = { getOptDocuments };
