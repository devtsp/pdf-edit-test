import React from 'react';
import { Buffer } from 'buffer/';

import { Document, Page } from 'react-pdf/dist/esm/entry.webpack5';

export function Reactpdf({ documentPath = 'Acknowledgement HIPAA.pdf' }) {
	const [numPages, setNumPages] = React.useState(null);
	const [pageNumber, setPageNumber] = React.useState(1);
	const [pdf64, setPdf64] = React.useState([]);

	function onDocumentLoadSuccess({ numPages }) {
		setNumPages(numPages);
	}

	React.useEffect(() => {
		async function generateBase64() {
			const arrayBuffer = await fetch(documentPath).then((res) => res.arrayBuffer());
			const buffer = Buffer.from(arrayBuffer, 'binary');
			const base64 = 'data:application/pdf;base64,' + buffer.toString('base64');
			console.log(base64);
			setPdf64(base64);
		}

		generateBase64();
	}, []);

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<div style={{ border: '2px dashed pink' }}>
					<Document
						file={pdf64}
						onLoadSuccess={onDocumentLoadSuccess}
						// options={{ workerSrc: '/pdf.worker.js' }}
					>
						<Page pageNumber={pageNumber} />
					</Document>
				</div>
				<div
					style={{
						backgroundImage: `url("${pdf64}")`,
						border: '1px solid black',
						height: '840px',
						width: '600px',
						backgroundSize: 'contain',
						backgroundPosition: 'center',
						backgroundRepeat: 'no-repeat',
					}}
				></div>
			</div>
		</div>
	);
}
