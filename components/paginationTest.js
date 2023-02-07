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
				prev[prev.length - 1].toString() == curr.toString() && curr.length
					? [...prev]
					: [...prev, curr],
			[[]]
		);

		// Below lines are to remove glitched coordinates of every stroke starting point 'M' (this happen when scrolling while signing)
		// **
		for (let coord of reducedPath) {
			// find every stroke beggining
			if (coord[0] === 'M') {
				// Prepend an 'M' to the next coordinate object
				reducedPath[reducedPath.indexOf(coord) + 1]?.unshift('M');
				// remove itself from coordinates array (potencially broken/glitched stroke)
				reducedPath.splice(reducedPath.indexOf(coord), 1);
			}
		}
		// **

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
		const rect = canvas?.getBoundingClientRect();
		let isDrawing = false;

		if (canvasRef.current) {
			canvas.width = canvas?.offsetWidth;
			canvas.height = canvas?.offsetHeight;
		}

		// cancel signature
		const handleSignatureStarts = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			setSignaturePath([]);
			setIsSigning(false);
		};

		// track pointer
		const handlePointermove = (e) => {
			if (!isDrawing) return;
			ctx.lineTo(e.offsetX, e.offsetY);
			ctx.stroke();
			setSignaturePath((prev) => [...prev, [e.offsetX, e.offsetY]]);
		};

		// finish stroke
		const handleFinishStroke = (e) => {
			isDrawing = false;
		};

		// desktop
		const handleMousedown = (e) => {
			isDrawing = true;
			ctx.beginPath();
			ctx.moveTo(e.offsetX, e.offsetY);
			setSignaturePath((prev) => [...prev, ['M', e.offsetX, e.offsetY]]);
		};

		// mobile
		const handleTouchstart = (e) => {
			isDrawing = true;
			const x = e.targetTouches[0].clientX - rect.x;
			const y = e.targetTouches[0].clientY - rect.y;
			ctx.beginPath();
			setSignaturePath((prev) => [...prev, ['M', x, y]]);
		};

		function setListeners() {
			// set common signature trigger from button
			clearCanvasBtnRef.current.addEventListener('click', handleSignatureStarts);
			// set common pointer move event for both mouse and touch
			canvas.addEventListener('pointermove', handlePointermove);
			// set mouse events
			canvas.addEventListener('mousedown', handleMousedown);
			canvas.addEventListener('mouseup', handleFinishStroke);
			// set touch events
			canvas.addEventListener('touchstart', handleTouchstart);
			canvas.addEventListener('touchend', handleFinishStroke);
		}

		if (canvasRef.current) {
			setListeners();
		}

		return () => {
			if (canvas) {
				// clear common events
				canvas.removeEventListener('click', handleSignatureStarts);
				canvas.removeEventListener('pointermove', handlePointermove);
				// clear mouse events
				canvas.removeEventListener('mousedown', handleMousedown);
				canvas.removeEventListener('mouseup', handleFinishStroke);
				// clear touch events
				canvas.removeEventListener('touchstart', handleTouchstart);
				canvas.removeEventListener('touchend', handleFinishStroke);
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
		<div
			style={{ display: 'flex', flexDirection: 'column', width: 'fit-content', margin: '0 auto' }}
		>
			{/* TOP CTRL BUTTONS */}
			<div
				style={{
					display: 'flex',
					padding: '10px 0',
					userSelect: 'none',
					height: '40px',
					alignItems: 'center',
				}}
			>
				<span
					onClick={() => setActivePage((prev) => (prev === 1 ? prev : --prev))}
					style={{
						padding: '0 10px',
						cursor: 'pointer',
						opacity: activePage === 1 ? '.2' : '1',
						pointerEvents: activePage === 1 ? 'none' : 'all',
					}}
				>
					◀
				</span>

				<span style={{}}>
					{' '}
					Page {activePage}/{pdfDoc?.getPageCount()}{' '}
				</span>
				<span
					onClick={() => setActivePage((prev) => (prev < pdfDoc?.getPageCount() ? ++prev : prev))}
					style={{
						padding: '0 10px',
						cursor: 'pointer',
						opacity: activePage === pdfDoc?.getPageCount() ? '.2' : '1',
						pointerEvents: activePage === pdfDoc?.getPageCount() ? 'none' : 'all',
					}}
				>
					▶
				</span>
				<div style={{ marginLeft: 'auto', gap: '10px', display: 'flex', alignItems: 'center' }}>
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
							Sign
						</button>
					) : null}
					{isSigning ? (
						<>
							<span onClick={handleSaveSignature} style={{ cursor: 'pointer', fontSize: '22px' }}>
								✔
							</span>
							<span ref={clearCanvasBtnRef} style={{ cursor: 'pointer', fontSize: '18px' }}>
								❌
							</span>
						</>
					) : null}
				</div>
			</div>

			{/* EDTION PANEL */}
			{pdfDoc ? (
				// RELATIVE DIV TO HANDLE ABSOLUTES INSIDE
				<div
					style={{
						border: 'none',
						height: pdfDoc.getPage(activePage - 1).getSize().height,
						width: pdfDoc.getPage(activePage - 1).getSize().width,
						position: 'relative',
					}}
				>
					{isSigning ? (
						/* SIGNATURE CANVAS */
						<canvas
							ref={canvasRef}
							style={{
								height: pdfDoc?.getPage(activePage - 1).getSize()?.height,
								width: pdfDoc?.getPage(activePage - 1).getSize()?.width,
								position: 'absolute',
								backgroundColor: 'rgba(162, 240, 236,.1)',
								left: '0',
								top: '0',
								zIndex: '300',
								outline: '5px dashed rgb(162, 240, 236)',
								...(isSigning && { cursor: 'url("icons/pen.png") 0 32, crosshair' }),
								touchAction: 'none',
							}}
						></canvas>
					) : null}

					{/* PDF PREVIEW (PNG) */}
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

					{/* MAPPED ACRO FIELDS */}
					{fields
						.filter(({ page }) => page === activePage)
						.map(({ type, rectangle, name, value, checked, path = '' }, i) => {
							if (type === 'signature') {
								return (
									<svg
										key={i}
										height={pdfDoc?.getPage(activePage - 1).getSize()?.height}
										width={pdfDoc?.getPage(activePage - 1).getSize()?.width}
										fill="none"
										stroke="black"
										style={{
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
									key={i}
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
									id={name}
									name={name}
									data-field-type={type}
								/>
							);
						})}
				</div>
			) : null}
		</div>
	);
};

export default Pagination;
