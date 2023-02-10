import React from 'react';

export function Pspdfkit({ initialDoc = 'Acknowledgement HIPAA.pdf' }) {
	const containerRef = React.useRef(null);
	const [instance, setInstance] = React.useState();
	const [updatedPdfBuffer, setUpdatedPdfBuffer] = React.useState();

	React.useEffect(() => {
		const container = containerRef.current;
		let PSPDFKit;
		(async function () {
			PSPDFKit = await import('pspdfkit');
			if (PSPDFKit) {
				PSPDFKit.unload(container);
			}
			await PSPDFKit.load({
				container,
				document: initialDoc,
				baseUrl: `${window.location.protocol}//${window.location.host}/`,
			}).then((instance) => {
				setInstance(instance);
			});
		})();
		return () => PSPDFKit && PSPDFKit.unload(container);
	}, []);

	async function handleSavePdf() {
		const content = await instance.exportPDF({ flatten: true });
		setUpdatedPdfBuffer(content);
	}

	return (
		<>
			<h3>Invasive watermark in editor and saved doc (almost unusable)</h3>
			<button onClick={handleSavePdf} className="save-btn">
				SAVE
			</button>
			<br />
			<div ref={containerRef} style={{ height: '80vh', width: '50%', display: 'inline-block' }} />
			<iframe
				style={{
					height: '80vh',
					width: '50%',
					display: 'inline-block',
					border: 'none',
				}}
				src={
					updatedPdfBuffer
						? URL.createObjectURL(new Blob([updatedPdfBuffer], { type: 'application/pdf' }))
						: initialDoc
				}
			></iframe>
		</>
	);
}
