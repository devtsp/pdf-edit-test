import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { IconButton, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { ACROFORMS_CONFIG } from '../constants/acroformsConfig';

const PDFViewer = ({ docConfig = ACROFORMS_CONFIG.CONSENT_SHARE_BEHAVIORAL_HEALTH_INFO }) => {
	const canvasRef = React.useRef();
	const clearCanvasBtnRef = React.useRef();
	// signature related
	const [signaturePath, setSignaturePath] = React.useState([]);
	const [isSigning, setIsSigning] = React.useState(false);
	// pdf document related
	const [pdfDoc, setPdfDoc] = React.useState();
	const [fields, setFields] = React.useState([]);
	const [activePage, setActivePage] = React.useState(1);
	const [updatedPdfBuffer, setUpdatedPdfBuffer] = React.useState();

	async function getPdfInfo(documentPath) {
		const formPdfBytes = await fetch(documentPath).then((res) => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(formPdfBytes);
		const form = pdfDoc.getForm();
		const formFields = form.getFields();

		// Map pdf-lib acrofields to build custom objects
		const customFields = formFields.map((field, i) => {
			const widgets = field.acroField.getWidgets();
			const { page } = docConfig.acroFieldsConfig
				? docConfig.acroFieldsConfig.find(
						({ fieldsRange }) => i >= fieldsRange[0] && i <= fieldsRange[1]
				  )
				: { page: 1 };
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

	const handleSaveSignature = async () => {
		// Remove repeated coords
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
	};

	function handleInputChange(e) {
		const { name: _name } = e.currentTarget;
		const newState = [...fields];
		if (e.currentTarget.type === 'checkbox') {
			const foundField = newState.find(({ name }) => _name === name);
			newState.find(({ name }) => _name === name).checked = e.currentTarget.checked;
		}
		newState.find(({ name }) => _name === name).value = e.currentTarget.value;
		setFields(newState);
	}

	async function handleSavePdf() {
		const form = pdfDoc.getForm();
		for (let field of fields) {
			if (field.type === 'PDFTextField') {
				form.getTextField(field.name).setText(field.value);
			} else if (field.type === 'PDFCheckBox') {
				// Actual form checkboxes implementation (saving but losing data on form flattening)
				// field.checked
				// 	? form.getCheckBox(field.name).check()
				// 	: form.getCheckBox(field.name).uncheck();

				// Manually draw ticks instead (workaround))
				if (field.checked) {
					const page = pdfDoc.getPage(field.page - 1);
					page.moveTo(field.rectangle.x - 3, field.rectangle.y + 23);
					page.drawSvgPath(
						// svg path of a basic "tick" icon
						'M21 6.285l-11.16 12.733-6.84-6.018 1.319-1.49 5.341 4.686 9.865-11.196 1.475 1.285z'
					);
				}
			} else if (field.type === 'signature') {
				const page = pdfDoc.getPage(field.page - 1);
				page.moveTo(0, page.getHeight());
				page.drawSvgPath(field.path);
			}
		}
		form.flatten();
		const pdfBytes = await pdfDoc.save();
		setUpdatedPdfBuffer(pdfBytes);
		getPdfInfo(`documents/to_sign/${docConfig.documentName}/${docConfig.documentName}.pdf`);
	}

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
		getPdfInfo(`documents/to_sign/${docConfig.documentName}/${docConfig.documentName}.pdf`);
	}, []);

	return (
		<div
			style={{
				display: 'flex',
				margin: '0 auto',
				backgroundColor: 'lightgray',
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: 'fit-content',
					margin: '0 auto',
				}}
			>
				{/* TOP CTRL BUTTONS */}
				<div
					style={{
						display: 'flex',
						padding: '5px 0',
						userSelect: 'none',
						height: '30px',
						alignItems: 'center',
					}}
				>
					<IconButton
						onClick={() => setActivePage((prev) => (prev === 1 ? prev : --prev))}
						style={{
							cursor: 'pointer',
							opacity: activePage === 1 ? '.2' : '1',
							pointerEvents: activePage === 1 ? 'none' : 'all',
							display: 'flex',
							alignItems: 'center',
							fontSize: '16px',
						}}
					>
						<ArrowBackIosNewIcon sx={{ fontSize: 'inherit' }} />
					</IconButton>
					<span>
						Page {activePage}/{pdfDoc?.getPageCount()}
					</span>
					<IconButton
						onClick={() => setActivePage((prev) => (prev < pdfDoc?.getPageCount() ? ++prev : prev))}
						style={{
							cursor: 'pointer',
							opacity: activePage === pdfDoc?.getPageCount() ? '.2' : '1',
							pointerEvents: activePage === pdfDoc?.getPageCount() ? 'none' : 'all',
							display: 'flex',
							alignItems: 'center',
							fontSize: '16px',
						}}
					>
						<ArrowForwardIosIcon sx={{ fontSize: 'inherit' }} />
					</IconButton>
					<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
						{!isSigning ? (
							<div style={{ display: 'flex', gap: '10px' }}>
								<Button
									variant="contained"
									onClick={() => setIsSigning((prev) => !prev)}
									sx={{ fontSize: '12px', height: 'fit-content', py: '2px' }}
								>
									SIGN
								</Button>
								<Button
									variant="contained"
									onClick={handleSavePdf}
									sx={{ fontSize: '12px', height: 'fit-content', py: '2px' }}
								>
									SAVE PDF
								</Button>
							</div>
						) : null}
						{isSigning ? (
							<>
								<IconButton
									onClick={handleSaveSignature}
									style={{
										cursor: 'pointer',
										fontSize: '22px',
										color: 'darkgreen',
										display: 'flex',
										alignItems: 'center',
									}}
								>
									<CheckCircleIcon />
								</IconButton>
								<IconButton
									ref={clearCanvasBtnRef}
									style={{
										cursor: 'pointer',
										fontSize: '22px',
										color: 'darkred',
										display: 'flex',
										alignItems: 'center',
									}}
								>
									<CancelIcon />
								</IconButton>
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
									backgroundColor: 'rgba(162, 240, 236,.2)',
									left: '0',
									top: '0',
									zIndex: '300',
									outline: '2px dashed teal',
									...(isSigning && { cursor: 'crosshair' }),
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
								backgroundImage: `url("documents/to_sign/${docConfig.documentName}/${activePage}_${docConfig.documentName}.png")`,
								backgroundSize: 'contain',
							}}
						></div>

						{/* MAPPED ACRO FIELDS */}
						{fields
							.filter(({ page }) => page === activePage)
							.map(({ type, rectangle, name, value, checked, path = '' }, i) => {
								if (type === 'PDFTextField') {
									return (
										<textarea
											key={i}
											id={name}
											name={name}
											value={value}
											onChange={handleInputChange}
											style={{
												height: `${rectangle.height}px`,
												width: `${rectangle.width}px`,
												position: 'absolute',
												bottom: rectangle.y,
												left: rectangle.x,
												backgroundColor: 'transparent',
												border: 'none',
												padding: '0',
												zIndex: '200',
												resize: 'none',
											}}
										/>
									);
								} else if (type === 'PDFCheckBox') {
									return (
										<input
											key={i}
											type="checkbox"
											checked={Boolean(checked)}
											onChange={handleInputChange}
											id={name}
											name={name}
											style={{
												height: `${rectangle.height}px`,
												width: `${rectangle.width}px`,
												bottom: rectangle.y,
												left: rectangle.x,
												position: 'absolute',
												backgroundColor: 'transparent',
												border: 'none',
												padding: '0',
												zIndex: '200',
											}}
										/>
									);
								} else if (type === 'signature') {
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
							})}
					</div>
				) : null}
			</div>
			<>
				{updatedPdfBuffer ? (
					<iframe
						src={
							URL.createObjectURL(new Blob([updatedPdfBuffer], { type: 'application/pdf' })) +
							'#toolbar=0&view=FitV'
						}
						style={{
							border: 'none',
							width: '100%',
							display: 'inline-block',
						}}
					></iframe>
				) : null}
			</>
		</div>
	);
};

export default PDFViewer;
