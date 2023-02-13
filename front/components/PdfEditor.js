import React from 'react';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { Buffer } from 'buffer/';
import { useDoubleTap } from 'use-double-tap';
import { IconButton, Button } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IoIosArrowDropleftCircle, IoIosArrowDroprightCircle } from 'react-icons/io';

import { ACROFORMS_CONFIG } from '../constants/acroformsConfig';

export function PdfEditor({ optDocument, handleSubmit }) {
	// const [pdfjs, setPdfjs] = React.useState();
	const canvasRef = React.useRef();
	const clearCanvasBtnRef = React.useRef();
	// signature related
	const [signaturePath, setSignaturePath] = React.useState([]);
	const [isSigning, setIsSigning] = React.useState(false);
	// pdf document related
	const [pdfDoc, setPdfDoc] = React.useState();
	const [fields, setFields] = React.useState([]);
	const [activePage, setActivePage] = React.useState(1);

	// use-double-tap
	const bind = useDoubleTap(() => {
		setIsSigning((prev) => !prev);
	});

	const docConfig = ACROFORMS_CONFIG.find(
		({ documentAlias }) => documentAlias === optDocument.DocumentAlias
	);

	// ACROFORM FIELDS CONFIG HARDCODED
	async function getPdfInfo(base64EncodedPdf) {
		const formPdfBytes = await fetch(base64EncodedPdf).then((res) => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(formPdfBytes);
		const form = pdfDoc.getForm();
		const formFields = form.getFields();
		const pages = pdfDoc.getPages();

		// attempt to get field refs in page
		// for (let page = 0; page < pages.length; page++) {
		// 	const annotations = pages[page].node.Annots();
		// 	console.log(annotations.asArray());
		// }

		// Map pdf-lib acrofields to build custom objects
		const customFields = formFields.map((field, i) => {
			const widgets = field.acroField.getWidgets();
			const { page } = docConfig.acrofieldsRanges
				? docConfig.acrofieldsRanges.find(
						({ fieldsRanges }) => i >= fieldsRanges[0] && i <= fieldsRanges[1]
				  )
				: { page: 1 };
			return {
				checked: false,
				value: '',
				type:
					field instanceof PDFTextField
						? 'text'
						: field instanceof PDFCheckBox
						? 'checkbox'
						: 'other',
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
			newState.find(({ name }) => _name === name).checked = e.currentTarget.checked;
		}
		newState.find(({ name }) => _name === name).value = e.currentTarget.value;
		setFields(newState);
	}

	async function handleSavePdf() {
		const form = pdfDoc.getForm();
		for (let field of fields) {
			if (field.type === 'text') {
				form.getTextField(field.name).setText(field.value);
			} else if (field.type === 'checkbox') {
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
		// setUpdatedPdfBuffer(pdfBytes);
		handleSubmit(pdfBytes, optDocument);
		getPdfInfo(optDocument.base64EncodedPdf);
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
		getPdfInfo(optDocument.base64EncodedPdf);
	}, []);

	//attempt to get field page number (doesn't work)
	// React.useEffect(() => {
	// 	(async function () {
	// 		// We import this here so that it's only loaded during client-side rendering.
	// 		const pdfJS = await import('pdfjs-dist/build/pdf');
	// 		pdfJS.GlobalWorkerOptions.workerSrc = window.location.origin + '/lib/pdf.worker.min.js';
	// 		setPdfjs(pdfJS);
	// 		const pdf = await pdfJS.getDocument('new_document.pdf').promise;
	// 		const annots = await pdf.getFieldObjects();
	// 		console.log(annots);
	// 	})();
	// }, []);

	return (
		// ACCORDION INNER SPACE
		<div
			style={{
				display: 'flex',
				margin: '0 auto',
				backgroundColor: 'rgba(0,0,0,.05)',
				padding: '10px 0',
			}}
		>
			<img />
			{/* PAGE / ARROWS / TOOLBAR CONTAINER */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					margin: '0 auto',
					height: 'fit-content',
				}}
			>
				{/* BACK PAGE BTN */}
				<IconButton
					onClick={() => setActivePage((prev) => (prev === 1 ? prev : --prev))}
					disabled={activePage === 1}
				>
					<IoIosArrowDropleftCircle
						style={{
							pointerEvents: activePage === 1 ? 'none' : 'all',
							fontSize: '40px',
							color: 'black',
							opacity: activePage === 1 ? '0' : '.5',
						}}
					/>
				</IconButton>

				{/* PAGE AND TOOLS */}
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					{/* TOP TOOLBAR */}
					<div
						style={{
							display: 'flex',
							userSelect: 'none',
							alignItems: 'center',
							height: '40px',
							backgroundColor: 'rgba(0,0,0,.3)',
							padding: '0 10px',
							background: 'linear-gradient(to top, rgba(0,0,0,.5), rgba(0,0,0,0.3))',
						}}
					>
						{/*  PAGE INDICATOR */}
						<span style={{ color: 'white' }}>
							Page: {activePage}/{pdfDoc?.getPageCount()}
						</span>

						{/* TOP RIGHT BTNS */}
						<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
							{/* START SIGNING / SAVE PDF BTNS */}
							{!isSigning ? (
								<div style={{ display: 'flex', gap: '10px' }}>
									{/* SIGN BTN */}
									<Button
										variant="contained"
										onClick={() => setIsSigning((prev) => !prev)}
										sx={{ fontSize: '12px', height: 'fit-content', py: '2px' }}
									>
										SIGN
									</Button>

									{/* CLEAR SIGNATURES BTN */}
									{fields.filter(({ type, page }) => type === 'signature' && page === activePage)
										.length ? (
										<Button
											variant="contained"
											onClick={() =>
												setFields((prev) =>
													prev.filter(
														({ type, page }) => !(type === 'signature' && page === activePage)
													)
												)
											}
											sx={{ fontSize: '12px', height: 'fit-content', py: '2px' }}
										>
											CLEAR PAGE SIGNATURES
										</Button>
									) : null}
								</div>
							) : null}
						</div>
					</div>

					{/* EDTION PANEL */}

					<div style={{ display: 'flex', alignItems: 'center' }}>
						{/* PDF MAIN PAGE CONTAINER (RELATIVE, PDF PREVIEW) */}
						{pdfDoc ? (
							<div
								{...bind}
								style={{
									border: 'none',
									height: pdfDoc.getPage(activePage - 1).getSize().height,
									width: pdfDoc.getPage(activePage - 1).getSize().width,
									position: 'relative',
									userSelect: 'none',
									backgroundImage: `url("${optDocument.pngPreviews[activePage - 1]}")`,
									backgroundSize: 'contain',
								}}
							>
								{/* CONFIRM AND CANCEL SIGNATURE BTNS */}
								{isSigning ? (
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											position: 'absolute',
											right: '10px',
											top: pdfDoc.getPage(activePage - 1).getSize().height / 2 - 43,
											zIndex: '600',
											backgroundColor: 'white',
											borderRadius: '50px',
											outline: '2px dashed teal',
										}}
									>
										{/* CONFIRM BTN */}
										<IconButton
											onClick={handleSaveSignature}
											sx={{
												cursor: 'pointer',
												fontSize: '26px',
												color: 'green',
												display: 'flex',
												alignItems: 'center',
											}}
										>
											<CheckCircleIcon sx={{ fontSize: 'inherit' }} />
										</IconButton>

										{/* CANCEL BTN */}
										<IconButton
											ref={clearCanvasBtnRef}
											sx={{
												cursor: 'pointer',
												fontSize: '26px',
												color: 'darkred',
												display: 'flex',
												alignItems: 'center',
											}}
										>
											<CancelIcon sx={{ fontSize: 'inherit' }} />
										</IconButton>
									</div>
								) : null}

								{/* SIGNATURE CANVAS ZINDEX 400 */}
								{isSigning ? (
									<canvas
										ref={canvasRef}
										style={{
											height: pdfDoc?.getPage(activePage - 1).getSize()?.height,
											width: pdfDoc?.getPage(activePage - 1).getSize()?.width,
											position: 'absolute',
											backgroundColor: 'rgba(162, 240, 236,.2)',
											left: '0',
											top: '0',
											zIndex: '400',
											outline: '2px dashed teal',
											...(isSigning && { cursor: 'crosshair' }),
											touchAction: 'none',
										}}
									></canvas>
								) : null}

								{/* ACROFIELDS */}
								{fields
									.filter(({ page }) => page === activePage)
									.map(({ type, rectangle, name, value, checked, path = '' }, i) => {
										// TEXTFIELDS ZINDEX 300
										if (type === 'text') {
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
														bottom: rectangle.y,
														left: rectangle.x,
														position: 'absolute',
														zIndex: '300',
														backgroundColor: 'transparent',
														border: 'none',
														padding: '0',
														resize: 'none',
														overflow: 'hidden',
													}}
												/>
											);
											// CHECKBOXES ZINDEX 300
										} else if (type === 'checkbox') {
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
														zIndex: '300',
														backgroundColor: 'transparent',
														border: 'none',
														padding: '0',
														margin: '0',
													}}
												/>
											);
											// SAVED SVG SIGNATURES ZINDEX 200
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
														zIndex: '200',
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
					{/* SAVE BTN */}
					<Button
						size="small"
						variant="contained"
						onClick={handleSavePdf}
						sx={{
							mt: '10px',
						}}
					>
						SAVE PDF
					</Button>
				</div>
				{/*  NEXT PAGE BTN */}
				<IconButton
					onClick={() => setActivePage((prev) => (prev < pdfDoc?.getPageCount() ? ++prev : prev))}
					disabled={activePage === pdfDoc?.getPageCount()}
				>
					<IoIosArrowDroprightCircle
						style={{
							pointerEvents: activePage === pdfDoc?.getPageCount() ? 'none' : 'all',
							fontSize: '40px',
							color: 'black',
							opacity: activePage === pdfDoc?.getPageCount() ? '0' : '.5',
						}}
					/>
				</IconButton>
			</div>
		</div>
	);
}
