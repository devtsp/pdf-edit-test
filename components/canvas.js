import React from 'react';
import { PDFDocument } from 'pdf-lib';

const Canvas = ({ initialDoc = 'Acknowledgement HIPAA.pdf' }) => {
	const canvasRef = React.useRef();
	const [isDrawing, setIsDrawing] = React.useState(false);
	const [pdfInfo, setPdfInfo] = React.useState([]);
	const [convertedPdf, setConvertedPdf] = React.useState();

	React.useEffect(() => {
		canvasRef.current.onmousedown = function () {
			setIsDrawing(true);
		};

		canvasRef.current.onmouseup = function () {
			setIsDrawing(false);
		};

		getPdfInfo();
	}, []);

	async function getPdfInfo() {
		const formPdfBytes = await fetch(initialDoc).then(res => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(formPdfBytes);
		const { width, height } = pdfDoc.getPage(0).getSize();
		setPdfInfo({ page: 0, height, width });
		console.log('page h: ', height, 'page w:', width);
	}

	function handleMouseMovement(e) {
		console.log('trigger');
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const porcentualPositionX = (x * 100) / rect.width;
		const porcentualPositionY = (y * 100) / rect.height;
		if (isDrawing) {
			console.log(
				'Left: %' + porcentualPositionX + ', Top: %' + porcentualPositionY
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
		<div style={{ display: 'flex' }}>
			<div
				style={{
					border: '1px solid black',
					height: pdfInfo.height,
					width: pdfInfo.width,
					position: 'relative',
					padding: '10px',
					boxSizing: 'content-box',
				}}
				onMouseMove={handleMouseMovement}
				ref={canvasRef}
			>
				<iframe
					src={initialDoc + '#toolbar=0&view=Fit'}
					style={{
						border: 'none',
						margin: 'auto',
						padding: '0',
						height: pdfInfo.height,
						width: pdfInfo.width,
					}}
					// ref={canvasRef}
				></iframe>
			</div>
			<div
				onMouseMove={handleMouseMovement}
				style={{
					border: '1px solid black',
					margin: 'auto',
					height: pdfInfo.height,
					width: pdfInfo.width,
				}}
			></div>
		</div>
	);
};

export default Canvas;
