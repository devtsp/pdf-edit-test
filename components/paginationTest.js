import React from 'react';
import { PDFDocument } from 'pdf-lib';

const CONSENT_SHARE_BEHAVIORAL_HEALTH_INFO = {
	folderPath:
		'png_docs/Consent to Share Behavioral Health Information for Care Coordination Pursposes',
	documentAlias: 'Consent to Share Behavioral Health Information for Care Coordination Pursposes',
	initialDoc: 'Consent_to_Share_Behavioral_Health_Information_for_Care_Coordination_Purposes.pdf',
	acroFieldsConfig: [
		{
			page: 1,
			fieldCount: [0, 4],
		},
		{
			page: 2,
			fieldCount: [5, 21],
		},
		{
			page: 3,
			fieldCount: [22, 38],
		},
		{
			page: 4,
			fieldCount: [39, 54],
		},
	],
};

const Pagination = ({ docConfig = CONSENT_SHARE_BEHAVIORAL_HEALTH_INFO }) => {
	const canvasRef = React.useRef();
	const clearCanvasBtnRef = React.useRef();
	// const svgPathRef = React.useRef();

	const [isSigning, setIsSigning] = React.useState(false);
	const [pdfInfo, setPdfInfo] = React.useState({});

	const [signaturePath, setSignaturePath] = React.useState([]);
	const [updatedPdfBuffer, setUpdatedPdfBuffer] = React.useState();

	const [pdfDoc, setPdfDoc] = React.useState();
	const [activePage, setActivePage] = React.useState(1);

	const [fields, setFields] = React.useState([]);

	React.useEffect(() => {
		async function mapFields(documentPath) {
			const formPdfBytes = await fetch(documentPath).then((res) => res.arrayBuffer());
			const form = pdfDoc.getForm();
			const formFields = form.getFields();
			const customFields = formFields.map((field, i) => {
				const name = field.getName();
				const widgets = field.acroField.getWidgets();
				const { page } = docConfig.acroFieldsConfig.find(
					({ fieldCount }) => i >= fieldCount[0] && i <= fieldCount[1]
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
			mapFields(`${docConfig.folderPath}/${docConfig.initialDoc}`);
		}
	}, [pdfDoc]);

	const handlePrintSvg = async () => {
		const reducedPath = signaturePath.reduce(
			(prev, curr) =>
				prev[prev.length - 1].toString() == curr.toString() ? [...prev] : [...prev, curr],
			[[]]
		);
		const formattedPath = reducedPath.toString().replace(/,/g, ' ');
		const buffer = await fetch(`${docConfig.folderPath}/${docConfig.initialDoc}`).then((res) =>
			res.arrayBuffer()
		);
		const uint8arr = new Uint8Array(buffer);
		const pdfDoc = await PDFDocument.load(uint8arr);
		const page = pdfDoc.getPage(0);
		page.moveTo(0, page.getHeight());
		page.moveDown(10);
		page.drawSvgPath(formattedPath);
		const pdfBytes = await pdfDoc.save();
		setUpdatedPdfBuffer(pdfBytes);
	};

	React.useEffect(() => {
		function setListeners() {
			const canvas = canvasRef.current;
			const ctx = canvas.getContext('2d');
			let isDrawing = false;
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			clearCanvasBtnRef.current.addEventListener('click', () => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				setSignaturePath([]);
			});
			canvas.addEventListener('mousedown', (e) => {
				isDrawing = true;
				ctx.beginPath();
				setSignaturePath((prev) => [...prev, ['M', e.offsetX, e.offsetY]]);
			});
			canvas.addEventListener('mouseup', (e) => {
				isDrawing = false;
			});
			canvas.addEventListener('mousemove', (e) => {
				if (!isDrawing) return;
				ctx.lineTo(e.offsetX, e.offsetY);
				ctx.stroke();
				setSignaturePath((prev) => [...prev, [e.offsetX, e.offsetY]]);
			});
		}

		if (canvasRef.current) {
			setListeners();
		}
	}, [pdfInfo, canvasRef]);

	React.useEffect(() => {
		async function getPdfInfo() {
			const formPdfBytes = await fetch(`${docConfig.folderPath}/${docConfig.initialDoc}`).then(
				(res) => res.arrayBuffer()
			);
			const pdfDoc = await PDFDocument.load(formPdfBytes);
			setPdfDoc(pdfDoc);
			setPdfInfo({ pages: pdfDoc.getPageCount() });
		}
		getPdfInfo();
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
								onClick={() => setActivePage((prev) => (prev < pdfInfo.pages ? ++prev : prev))}
							>
								next
							</button>
							<button
								onClick={() => setIsSigning((prev) => !prev)}
								style={{
									color: isSigning ? 'white' : 'black',
									backgroundColor: isSigning ? 'red' : 'transparent',
									border: '1px solid',
									borderRadius: '2px',
									borderColor: isSigning ? 'red' : 'grey',
									marginLeft: 'auto',
								}}
							>
								{isSigning ? 'SIGNING' : 'SIGN'}
							</button>
							<button ref={clearCanvasBtnRef}>CLEAR</button>
							<button onClick={handlePrintSvg}>PRINT SVG</button>
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
								<canvas
									ref={canvasRef}
									style={{
										height: pdfDoc?.getPage(activePage - 1).getSize()?.height,
										width: pdfDoc?.getPage(activePage - 1).getSize()?.width,
										position: 'absolute',
										backgroundColor: 'rgba(0,0,0,.2)',
										left: isSigning ? '0' : '-99999999999px',
										zIndex: '100',
										outline: '3px dashed pink',
									}}
								></canvas>
								<div
									style={{
										border: 'none',
										height: pdfDoc?.getPage(activePage - 1).getSize()?.height,
										width: pdfDoc?.getPage(activePage - 1).getSize()?.width,
										pointerEvents: isSigning ? 'none' : 'all',
										userSelect: 'none',
										backgroundImage: `url("${docConfig.folderPath}/${activePage}_${docConfig.documentAlias}.png")`,
										backgroundSize: 'contain',
									}}
								></div>
								{fields
									.filter(({ page }) => page === activePage)
									.map(({ type, rectangle, name, value, checked }) => (
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
									))}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Pagination;
