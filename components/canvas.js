import React from 'react';
import { PDFDocument } from 'pdf-lib';

const Canvas = ({ initialDoc = 'Acknowledgement HIPAA.pdf' }) => {
	const canvasRef = React.useRef();
	const clearCanvasBtnRef = React.useRef();
	const svgPathRef = React.useRef();

	const [isSigning, setIsSigning] = React.useState(false);
	const [pdfInfo, setPdfInfo] = React.useState([]);

	const [signaturePath, setSignaturePath] = React.useState([]);
	const [updatedPdfBuffer, setUpdatedPdfBuffer] = React.useState();

	const handlePrintSvg = async () => {
		const reducedPath = signaturePath.reduce(
			(prev, curr) =>
				prev[prev.length - 1].toString() == curr.toString()
					? [...prev]
					: [...prev, curr],
			[[]]
		);
		const formattedPath = reducedPath.toString().replace(/,/g, ' ');
		// svgPathRef.current.setAttribute('d', formattedPath);

		// const page = pdfDoc.getPage(0);
		// page.moveTo(0, 0);
		// page.drawSvgPath(formattedPath);
		// const pdfBytes = await pdfDoc.save();
		// setUpdatedPdfBuffer(pdfBytes);

		const buffer = await fetch(initialDoc).then(res => res.arrayBuffer());
		const uint8arr = new Uint8Array(buffer);
		const pdfDoc = await PDFDocument.load(uint8arr);
		// const pdfDoc = await PDFDocument.create();

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

			canvas.addEventListener('mousedown', e => {
				isDrawing = true;
				ctx.beginPath();
				setSignaturePath(prev => [...prev, ['M', e.offsetX, e.offsetY]]);
			});

			canvas.addEventListener('mouseup', e => {
				isDrawing = false;
			});

			canvas.addEventListener('mousemove', e => {
				if (!isDrawing) return;
				ctx.lineTo(e.offsetX, e.offsetY);
				ctx.stroke();
				setSignaturePath(prev => [...prev, [e.offsetX, e.offsetY]]);
			});
		}

		setListeners();
	}, [pdfInfo]);

	React.useEffect(() => {
		async function getPdfInfo() {
			const formPdfBytes = await fetch(initialDoc).then(res =>
				res.arrayBuffer()
			);
			const pdfDoc = await PDFDocument.load(formPdfBytes);
			const { width, height } = pdfDoc.getPage(0).getSize();
			setPdfInfo({ page: 0, height, width });
		}
		getPdfInfo();
	}, []);

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			<div>
				<div style={{ display: 'flex' }}>
					<div>
						<div style={{ display: 'flex', padding: '10px 0' }}>
							<button
								onClick={() => setIsSigning(prev => !prev)}
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
						<div
							style={{
								border: 'none',
								height: pdfInfo.height,
								width: pdfInfo.width,
								position: 'relative',
							}}
						>
							<canvas
								ref={canvasRef}
								style={{
									height: pdfInfo.height,
									width: pdfInfo.width,
									position: 'absolute',
									backgroundColor: 'rgba(0,0,0,.2)',
									left: isSigning ? '0' : '-99999999999px',
									zIndex: '100',
									outline: '3px dashed pink',
								}}
							></canvas>
							<iframe
								src={initialDoc + '#toolbar=0&view=FitV'}
								style={{
									border: 'none',
									height: pdfInfo.height,
									width: pdfInfo.width,
									pointerEvents: isSigning ? 'none' : 'all',
									userSelect: 'none',
								}}
							></iframe>
						</div>
					</div>
					{/* <svg
						width={pdfInfo.width}
						height={pdfInfo.height}
						fill="none"
						stroke="black"
						style={{ border: '1px solid black', marginTop: 'auto' }}
					>
						<path fill="none" ref={svgPathRef}></path>
					</svg> */}
					<iframe
						style={{
							height: pdfInfo.height,
							width: pdfInfo.width,
							marginTop: 'auto',
						}}
						src={
							updatedPdfBuffer
								? URL.createObjectURL(
										new Blob([updatedPdfBuffer], { type: 'application/pdf' })
								  )
								: initialDoc
						}
					></iframe>
				</div>
			</div>
		</div>
	);
};

export default Canvas;
