import React from 'react';
import { PDFDocument } from 'pdf-lib';
import { createGlobalStyle } from 'precise-ui/dist/es6';

const Canvas = ({ initialDoc = 'Acknowledgement HIPAA.pdf' }) => {
	const canvasRef = React.useRef();
	const clearCanvasBtnRef = React.useRef();
	const svgPathRef = React.useRef();

	const [isSigning, setIsSigning] = React.useState(false);
	const [pdfInfo, setPdfInfo] = React.useState([]);

	const [signaturePath, setSignaturePath] = React.useState([]);

	const handlePrintSvg = () => {
		console.log(signaturePath);
		const reducedPath = signaturePath.reduce(
			(prev, curr) =>
				prev[prev.length - 1].toString() == curr.toString()
					? [...prev]
					: [...prev, curr],
			[[]]
		);
		const formattedPath = reducedPath.toString().replace(/,/g, ' ');
		console.log(formattedPath);
		svgPathRef.current.setAttribute('d', formattedPath);
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
				setSignaturePath(prev => [...prev, [',Z,']]);
			});

			canvas.addEventListener('mousemove', e => {
				if (!isDrawing) return;
				ctx.lineTo(e.offsetX, e.offsetY);
				ctx.stroke();
				setSignaturePath(prev => [...prev, [',L,', e.offsetX, e.offsetY]]);
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
					<svg
						width={pdfInfo.width}
						height={pdfInfo.height}
						fill="none"
						stroke="black"
						style={{ border: '1px solid black', marginTop: 'auto' }}
					>
						<path ref={svgPathRef}></path>
					</svg>
				</div>
			</div>
		</div>
	);
};

export default Canvas;
