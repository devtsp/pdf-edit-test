import React from 'react';
import { PDFDocument } from 'pdf-lib';

export function PdfjsExpress({ initialDoc = 'Acknowledgement HIPAA.pdf' }) {
	const viewer = React.useRef();
	const [updatedPdf, setUpdatedPdf] = React.useState(initialDoc);
	const [formFields, setFormFields] = React.useState({});

	async function handlePdfChange(field, value) {
		setFormFields((prev) => ({ ...prev, [field.name]: value }));
	}

	React.useEffect(() => {
		import('@pdftron/pdfjs-express').then(() => {
			WebViewer(
				{
					path: '/lib/pdfjsexpress',
					initialDoc,
				},
				viewer.current
			).then((instance) => {
				const { annotationManager, documentViewer } = instance.Core;

				annotationManager.addEventListener('fieldChanged', handlePdfChange);
			});
		});
	}, []);

	async function savePdf() {
		const pdfBuffer = await fetch(initialDoc).then((res) => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(pdfBuffer);
		const form = pdfDoc.getForm();
		const fields = form.getFields();
		fields.forEach((field) => {
			const type = field.constructor.name;
			const name = field.getName();
			if (type === 'PDFTextField') {
				const field = form.getTextField(name);
				field.setText(formFields[name]);
			}
		});

		form.flatten();
		const pdfBytes = await pdfDoc.save();
		setUpdatedPdf(pdfBytes);
	}

	return (
		<div style={{ boxSizing: 'border-box' }}>
			<h3>
				Display acrofields correctly and lets you save without watermark, but PDF preview seems
				pretty bad (don't save drawings)
			</h3>
			<button onClick={savePdf} className="save-btn">
				SAVE
			</button>
			<br />
			<div
				className="webviewer"
				ref={viewer}
				style={{ height: '80vh', width: '50%', display: 'inline-block' }}
			></div>
			<iframe
				src={
					updatedPdf
						? URL.createObjectURL(new Blob([updatedPdf], { type: 'application/pdf' }))
						: initialDoc
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
