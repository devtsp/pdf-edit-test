import React from 'react';

import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function PSDPDF() {
	return (
		<div className={styles.container}>
			<Head>
				<title>PDF</title>
				<meta name="description" content="Generated by create next app" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<MyComponent initialDoc="/consent for treatment.pdf" />
		</div>
	);
}

const MyComponent = ({ initialDoc }) => {
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
			}).then(instance => {
				setInstance(instance);

				instance.addEventListener('document.saveStateChange', event => {
					console.log(`Save state changed: ${event.hasUnsavedChanges}`);
				});
			});
		})();

		return () => PSPDFKit && PSPDFKit.unload(container);
	}, []);

	async function flattenPDF() {
		const content = await instance.exportPDF({ flatten: true });
		console.log(content); // => ArrayBuffer of document with flattened form fields
		setUpdatedPdfBuffer(content);
	}

	return (
		<>
			{/* <button onClick={seeFields}>SEE FIELDS</button> */}
			<h1>
				PSPDF: full support for flattening annotations and forms but invasive
				watermark
			</h1>
			<button onClick={flattenPDF} style={{ margin: '20px' }}>
				FLATTEN{' '}
			</button>{' '}
			<br />
			<div
				ref={containerRef}
				style={{ height: '80vh', width: '50%', display: 'inline-block' }}
			/>
			<iframe
				style={{
					height: '80vh',
					width: '50%',
					display: 'inline-block',
					border: 'none',
				}}
				src={
					updatedPdfBuffer
						? URL.createObjectURL(
								new Blob([updatedPdfBuffer], { type: 'application/pdf' })
						  )
						: initialDoc
				}
			></iframe>
		</>
	);
};
