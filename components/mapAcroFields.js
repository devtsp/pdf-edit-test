import React from 'react';
import { PDFDocument } from 'pdf-lib';

const convertToBase64 = async (file) =>
	new Promise((res, rej) => {
		if (file && (file instanceof Blob || file instanceof ArrayBuffer)) {
			const reader = new FileReader();
			reader.onload = () => res(reader.result);
			reader.onerror = (error) => rej(error);
			reader.readAsDataURL(file);
		} else {
			res(file);
		}
	});

export default function MapAcroFields({
	documentPath = 'Acknowledgement HIPAA.pdf',
	// documentPath = 'test.avif',
}) {
	const formRef = React.useRef();
	const [document, setDocument] = React.useState();
	const [updatedPdf, setUpdatedPdf] = React.useState();
	const [base64, setBase64] = React.useState('');
	const [fields, setFields] = React.useState([]);

	React.useEffect(() => {
		async function mapFields(documentPath) {
			const formPdfBytes = await fetch(documentPath).then((res) => res.arrayBuffer());
			const pdfDoc = await PDFDocument.load(formPdfBytes);
			setDocument(pdfDoc);
			const form = pdfDoc.getForm();
			const formFields = form.getFields();
			const customFields = formFields.map((field) => {
				const name = field.getName();
				const widgets = field.acroField.getWidgets();
				return {
					type: field.constructor.name,
					name: field.getName(),
					rectangle: widgets.map((w) => w.getRectangle())[0],
				};
			});
			console.log(customFields);
			setFields(customFields);
		}

		mapFields(documentPath);
	}, []);

	async function handleSavePdf(e) {
		e.preventDefault();
		const formValues = [...formRef.current.elements].map(({ name, value, dataset }) => ({
			name,
			value,
			type: dataset.fieldType,
		}));
		console.log(formValues);
	}

	return (
		<>
			<button className="save-btn" onClick={handleSavePdf}>
				SAVE
			</button>
			<div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
				<iframe
					style={{ width: '600px', height: '800px' }}
					src={documentPath + '#toolbar=0&view=FitV'}
				></iframe>
				<form ref={formRef}>
					{fields.map(({ rectangle, name, type }) => {
						return (
							<input
								style={{
									display: 'block',
									height: `${rectangle.height}px`,
									width: `${rectangle.width}px`,
								}}
								type={
									type === 'PDFCheckBox' ? 'checkbox' : type === 'PDFRadioGroup' ? 'radio' : 'text'
								}
								key={name}
								id={name}
								name={name}
								data-field-type={type}
							/>
						);
					})}
				</form>
				{/* <iframe
            style={{ width: '600px', height: '800px', border: '1px solid black' }}
            src={URL.createObjectURL(new Blob([updatedPdf], { type: 'application/pdf' }))}
          ></iframe> */}
			</div>
		</>
	);
}
