import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const Canvas = ({ initialDoc = 'Acknowledgement HIPAA.pdf' }) => {
	// canvas events
	const canvasRef = React.useRef();
	const [canvasIsDrawing, setCanvasIsDrawing] = React.useState(false);
	const [canvasCoordinates, setCanvasCoordinates] = React.useState();

	const [isSigning, setIsSigning] = React.useState(false);

	const [pdfInfo, setPdfInfo] = React.useState([]);
	const [convertedPdf, setConvertedPdf] = React.useState();

	React.useEffect(() => {
		if (canvasRef.current) {
			canvasRef.current.onmousedown = function () {
				setCanvasIsDrawing(true);
			};

			canvasRef.current.onmouseup = function () {
				setCanvasIsDrawing(false);
			};
		}

		getPdfInfo();
	}, [canvasRef.current, isSigning]);

	async function getPdfInfo() {
		const formPdfBytes = await fetch(initialDoc).then(res => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(formPdfBytes);
		const { width, height } = pdfDoc.getPage(0).getSize();
		setPdfInfo({ page: 0, height, width });
	}

	function handleMouseMovement(e) {
		const rect = e.target.getBoundingClientRect();
		const x = (e.clientX - rect.left).toFixed(0);
		const y = e.clientY - rect.top;
		const porcentualPositionX = (x * 100) / rect.width;
		const porcentualPositionY = (y * 100) / rect.height;
		if (canvasIsDrawing) {
			setCanvasCoordinates(
				`Left: ${x} (%${porcentualPositionX.toFixed(
					2
				)}), Top: ${y} (%${porcentualPositionY.toFixed(2)})`
			);
		}
	}

	// async function convertToBase64(fileToLoad) {
	// 	const buffer = await fetch(fileToLoad).then(r => r.arrayBuffer());
	// 	const fileReader = new FileReader();
	// 	fileReader.onload = function (fileLoadedEvent) {
	// 		const base64 = fileLoadedEvent.target.result;
	// 		console.log(base64);
	// 		setPdf64(base64);
	// 	};
	// 	// Convert data to base64
	// 	fileReader.readAsDataURL(new Blob([buffer]));
	// }

	return (
		<div style={{ display: 'flex', justifyContent: 'center' }}>
			<div>
				<div style={{ display: 'flex', padding: '10px 0' }}>
					<span>
						Page h: {pdfInfo.height}, Page w: {pdfInfo.width}
					</span>
					<button
						onClick={() => setIsSigning(prev => !prev)}
						style={{
							color: isSigning ? 'white' : 'black',
							backgroundColor: isSigning ? 'red' : 'white',
							marginLeft: 'auto',
						}}
					>
						{isSigning ? 'SIGNING' : 'SIGN'}
					</button>
				</div>
				<span>
					{isSigning
						? canvasIsDrawing
							? canvasCoordinates
							: 'Waiting mouse-down event'
						: ''}
				</span>
				<div
					style={{
						border: 'none',
						margin: 'auto',
						padding: '0',
						height: pdfInfo.height,
						width: pdfInfo.width,
					}}
				>
					{isSigning ? (
						<div
							ref={canvasRef}
							onMouseMove={handleMouseMovement}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: 'auto',
								height: pdfInfo.height,
								width: pdfInfo.width,
								backgroundColor: 'red',
								opacity: '0.1',
								position: 'absolute',
								zIndex: '100',
							}}
						></div>
					) : null}
					<iframe
						src={initialDoc + '#toolbar=0&view=Fit'}
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
		</div>
	);
};

export default Canvas;
