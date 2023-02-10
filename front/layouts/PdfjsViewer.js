import React from 'react';

export function PdfjsViewer() {
	const canvasRef = React.useRef(null);

	React.useEffect(() => {
		(async function () {
			// We import this here so that it's only loaded during client-side rendering.
			const pdfJS = await import('pdfjs-dist/build/pdf');
			pdfJS.GlobalWorkerOptions.workerSrc = window.location.origin + '/lib/pdf.worker.min.js';
			const pdf = await pdfJS.getDocument(
				'/documents/to_sign/Consent to Share Behavioral Health Information/pdf/Consent_to_Share_Behavioral_Health_Information_for_Care_Coordination_Purposes_641573_7.pdf'
			).promise;

			const page = await pdf.getPage(1);
			const viewport = page.getViewport({ scale: 2 });

			// Prepare canvas using PDF page dimensions.
			const canvas = canvasRef.current;
			const canvasContext = canvas.getContext('2d');
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// Render PDF page into canvas context.
			const renderContext = { canvasContext, viewport };
			page.render(renderContext);
		})();
	}, []);

	return <canvas ref={canvasRef} style={{ height: '60vw' }} />;
}
