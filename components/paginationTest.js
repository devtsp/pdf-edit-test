import React from 'react';
import { PDFDocument } from 'pdf-lib';

const CONSENT_SHARE_BEHAVIORAL_HEALTH_INFO = {
	documentRawName: 'Consent to Share Behavioral Health Information for Care Coordination Purposes',
	acroFieldsConfig: [
		{
			page: 1,
			fieldsRange: [0, 4],
		},
		{
			page: 2,
			fieldsRange: [5, 21],
		},
		{
			page: 3,
			fieldsRange: [22, 38],
		},
		{
			page: 4,
			fieldsRange: [39, 54],
		},
	],
};

const Pagination = ({ docConfig = CONSENT_SHARE_BEHAVIORAL_HEALTH_INFO }) => {
	const canvasRef = React.useRef();
	const clearCanvasBtnRef = React.useRef();

	// svg path of active signing canvas
	const [signaturePath, setSignaturePath] = React.useState([]);
	const [isSigning, setIsSigning] = React.useState(false);
	// const [updatedPdfBuffer, setUpdatedPdfBuffer] = React.useState();

	// pdf-lib instance
	const [pdfDoc, setPdfDoc] = React.useState();
	// mapped fields state and info
	const [fields, setFields] = React.useState([]);

	const [activePage, setActivePage] = React.useState(1);

	React.useEffect(() => {
		async function mapFields() {
			const form = pdfDoc.getForm();
			const formFields = form.getFields();
			const customFields = formFields.map((field, i) => {
				const widgets = field.acroField.getWidgets();
				const { page } = docConfig.acroFieldsConfig.find(
					({ fieldsRange }) => i >= fieldsRange[0] && i <= fieldsRange[1]
				);
				return {
					checked: false,
					value: '',
					type: field.constructor.name,
					name: field.getName(),
					rectangle: widgets.map((w) => w.getRectangle())[0],
					page,
				};
			});
			setFields(customFields);
		}

		if (pdfDoc) {
			mapFields(`forms/${docConfig.documentRawName}/${docConfig.documentRawName}.pdf`);
		}
	}, [pdfDoc]);

	const handleSaveSignature = async () => {
		const reducedPath = signaturePath.reduce(
			(prev, curr) =>
				prev[prev.length - 1].toString() == curr.toString() ? [...prev] : [...prev, curr],
			[[]]
		);
		const formattedPath = reducedPath.toString().replace(/,/g, ' ');
		const newSignatureInput = { type: 'signature', path: formattedPath, page: activePage };
		setFields((prev) => [...prev, newSignatureInput]);
		setIsSigning(false);
		setSignaturePath('');

		// const buffer = await fetch(`${docConfig.folderPath}/${docConfig.initialDoc}`).then((res) =>
		// 	res.arrayBuffer()
		// );
		// const uint8arr = new Uint8Array(buffer);
		// const pdfDoc = await PDFDocument.load(uint8arr);
		// const page = pdfDoc.getPage(0);
		// page.moveTo(0, page.getHeight());
		// page.moveDown(10);
		// page.drawSvgPath(formattedPath);
		// const pdfBytes = await pdfDoc.save();
		// setUpdatedPdfBuffer(pdfBytes);
	};

	// Set all custom event handlers for canvas
	React.useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		let isDrawing = false;

		if (canvasRef.current) {
			canvas.width = canvas?.offsetWidth;
			canvas.height = canvas?.offsetHeight;
		}

		const onMouseDown = (e) => {
			isDrawing = true;
			ctx.beginPath();
			setSignaturePath((prev) => [...prev, ['M', e.offsetX, e.offsetY]]);
		};

		const onClick = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			setSignaturePath([]);
			setIsSigning(false);
		};

		const mouseUp = (e) => {
			isDrawing = false;
		};

		const mouseMove = (e) => {
			if (!isDrawing) return;
			ctx.lineTo(e.offsetX, e.offsetY);
			ctx.stroke();
			setSignaturePath((prev) => [...prev, [e.offsetX, e.offsetY]]);
		};

		function setListeners() {
			clearCanvasBtnRef.current.addEventListener('click', onClick);
			canvas.addEventListener('mousedown', onMouseDown);
			canvas.addEventListener('mouseup', mouseUp);
			canvas.addEventListener('mousemove', mouseMove);
		}

		if (canvasRef.current) {
			setListeners();
		}

		return () => {
			if (canvas) {
				canvas.removeEventListener('click', onClick);
				canvas.removeEventListener('mousedown', onMouseDown);
				canvas.removeEventListener('mouseup', mouseUp);
				canvas.removeEventListener('mousemove', mouseMove);
			}
		};
	}, [isSigning, canvasRef]);

	// Fetch and collect all pdf needed info, such as size, acro fields, etc
	React.useEffect(() => {
		async function getPdfInfo(documentPath) {
			const formPdfBytes = await fetch(documentPath).then((res) => res.arrayBuffer());
			const pdfDoc = await PDFDocument.load(formPdfBytes);
			const form = pdfDoc.getForm();
			const formFields = form.getFields();

			// Map pdf-lib acrofields to build custom objects
			const customFields = formFields.map((field, i) => {
				const widgets = field.acroField.getWidgets();
				const { page } = docConfig.acroFieldsConfig.find(
					({ fieldsRange }) => i >= fieldsRange[0] && i <= fieldsRange[1]
				);
				return {
					checked: false,
					value: '',
					type: field.constructor.name,
					name: field.getName(),
					rectangle: widgets.map((w) => w.getRectangle())[0],
					page,
				};
			});

			setPdfDoc(pdfDoc);
			setFields(customFields);
		}

		getPdfInfo(`forms/${docConfig.documentRawName}/${docConfig.documentRawName}.pdf`);
	}, []);

	function handleInputChange(e) {
		const { name: _name } = e.currentTarget;
		const newState = [...fields];
		if (e.currentTarget.type === 'checkbox') {
			newState.find(({ name }) => _name === name).checked = e.currentTarget.checked;
		}
		newState.find(({ name }) => _name === name).value = e.currentTarget.value;
		setFields(newState);
	}

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			<div>
				<div style={{ display: 'flex' }}>
					<div>
						<div style={{ display: 'flex', padding: '10px 0' }}>
							<button onClick={() => setActivePage((prev) => (prev === 1 ? prev : --prev))}>
								prev
							</button>
							<span>{activePage}</span>
							<button
								onClick={() =>
									setActivePage((prev) => (prev < pdfDoc.getPageCount() ? ++prev : prev))
								}
							>
								next
							</button>
							<div style={{ marginLeft: 'auto', gap: '10px', display: 'flex' }}>
								{!isSigning ? (
									<button
										onClick={() => setIsSigning((prev) => !prev)}
										style={{
											color: isSigning ? 'white' : 'black',
											backgroundColor: isSigning ? 'red' : 'transparent',
											border: '1px solid',
											borderRadius: '2px',
											borderColor: isSigning ? 'red' : 'grey',
										}}
									>
										{isSigning ? 'SIGNING' : 'SIGN'}
									</button>
								) : null}
								{isSigning ? (
									<>
										<button ref={clearCanvasBtnRef} style={{ color: 'red' }}>
											CANCEL
										</button>
										<button onClick={handleSaveSignature} style={{ color: 'yellowgreen' }}>
											SAVE
										</button>
									</>
								) : null}
							</div>
						</div>

						{pdfDoc ? (
							<div
								style={{
									border: 'none',
									height: pdfDoc.getPage(activePage - 1).getSize().height,
									width: pdfDoc.getPage(activePage - 1).getSize().width,
									position: 'relative',
								}}
							>
								{isSigning ? (
									<canvas
										ref={canvasRef}
										style={{
											height: pdfDoc?.getPage(activePage - 1).getSize()?.height,
											width: pdfDoc?.getPage(activePage - 1).getSize()?.width,
											position: 'absolute',
											backgroundColor: 'rgba(0,0,0,.2)',
											left: '0',
											zIndex: '300',
											outline: '2px dashed pink',
										}}
									></canvas>
								) : null}
								<div
									style={{
										border: 'none',
										height: pdfDoc?.getPage(activePage - 1).getSize()?.height,
										width: pdfDoc?.getPage(activePage - 1).getSize()?.width,
										pointerEvents: isSigning ? 'none' : 'all',
										userSelect: 'none',
										backgroundImage: `url("forms/${docConfig.documentRawName}/${activePage}_${docConfig.documentRawName}.png")`,
										backgroundSize: 'contain',
									}}
								></div>
								{fields
									.filter(({ page }) => page === activePage)
									.map(({ type, rectangle, name, value, checked, path = '' }) => {
										if (type === 'signature') {
											return (
												<svg
													height={pdfDoc?.getPage(activePage - 1).getSize()?.height}
													width={pdfDoc?.getPage(activePage - 1).getSize()?.width}
													fill="none"
													stroke="black"
													style={{
														border: '1px solid black',
														position: 'absolute',
														zIndex: '100',
														top: 0,
													}}
												>
													<path fill="none" d={path}></path>
												</svg>
											);
										}

										return (
											<input
												value={value}
												checked={Boolean(checked)}
												onChange={handleInputChange}
												style={{
													display: 'block',
													height: `${rectangle.height}px`,
													width: `${rectangle.width}px`,
													position: 'absolute',
													bottom: rectangle.y,
													left: rectangle.x,
													backgroundColor: 'transparent',
													border: 'none',
													padding: '0',
													zIndex: '200',
												}}
												type={
													type === 'PDFCheckBox'
														? 'checkbox'
														: type === 'PDFRadioGroup'
														? 'radio'
														: 'text'
												}
												key={name}
												id={name}
												name={name}
												data-field-type={type}
											/>
										);
									})}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Pagination;
