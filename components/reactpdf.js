import React, { useState } from 'react';

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';

export default function ReactPdf({
	documentPath = 'Acknowledgement HIPAA.pdf',
}) {
	const [numPages, setNumPages] = useState(null);
	const [pageNumber, setPageNumber] = useState(1);

	function onDocumentLoadSuccess({ numPages }) {
		setNumPages(numPages);
	}

	return (
		<div>
			<h3>Destroy acroform fields, unusable</h3>
			<Document file={documentPath} onLoadSuccess={onDocumentLoadSuccess}>
				<Page pageNumber={pageNumber} />
			</Document>
			<p>
				Page {pageNumber} of {numPages}
			</p>
		</div>
	);
}
