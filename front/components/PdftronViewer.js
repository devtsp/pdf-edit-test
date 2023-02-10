import React from 'react';
import { PDFDocument } from 'pdf-lib';

export function PdftronViewer({ initialDoc = 'Acknowledgement HIPAA.pdf' }) {
	const viewer = React.useRef(null);
	const [updatedPdfBuffer, setUpdatedPdfBuffer] = React.useState();
	const [viewerInstance, setViewerInstance] = React.useState();

	React.useEffect(() => {
		import('@pdftron/webviewer').then(() => {
			WebViewer(
				{
					path: '/webviewer',
					initialDoc,
				},
				viewer.current
			).then((instance) => {
				setViewerInstance(instance);
			});
		});
	}, []);

	async function handleSavePdf() {
		const { documentViewer, annotationManager } = viewerInstance.Core;
		const doc = documentViewer.getDocument();
		const xfdfString = await annotationManager.exportAnnotations();
		const buffer = await doc.getFileData({
			xfdfString,
		});
		const uint8arr = new Uint8Array(buffer);

		// USE PDFLIB TO FLATTEN FORM (PDFTRON PAID)
		const pdfDoc = await PDFDocument.load(uint8arr);
		const form = pdfDoc.getForm();
		form.flatten();
		const pdfBytes = await pdfDoc.save();
		setUpdatedPdfBuffer(pdfBytes);
	}

	return (
		<div style={{ boxSizing: 'border-box' }}>
			<h3>Able to save with pdf-lib help (watermarked)</h3>
			<button onClick={handleSavePdf} className="save-btn">
				SAVE
			</button>{' '}
			<br />
			<div ref={viewer} style={{ height: '80vh', width: '50%', display: 'inline-block' }}></div>
			<iframe
				src={
					updatedPdfBuffer
						? URL.createObjectURL(new Blob([updatedPdfBuffer], { type: 'application/pdf' })) +
						  +'#toolbar=0&view=FitV'
						: initialDoc + '#toolbar=0&view=FitV'
				}
				style={{
					border: 'none',
					height: '80vh',
					width: '50%',
					display: 'inline-block',
				}}
			></iframe>
		</div>
	);
}
