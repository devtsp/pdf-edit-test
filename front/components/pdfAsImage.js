import React from 'react';

export default function PdfAsImage({ initialDoc = 'Acknowledgement HIPAA.pdf' }) {
	const viewerRef = React.useRef();
	const [viewerInstance, setViewerInstance] = React.useState();
	const [pdfImage, setPdfImage] = React.useState();
	React.useEffect(() => {
		import('@pdftron/webviewer').then(() => {
			WebViewer(
				{
					fullAPI: true,
					path: '/webviewer',
					initialDoc,
				},
				viewerRef.current
			).then(async (instance) => {
				setViewerInstance(instance);
				const { Core } = instance;
				const { documentViewer, PDFNet } = Core;

				await PDFNet.initialize();

				documentViewer.addEventListener('documentLoaded', async () => {
					const doc = await documentViewer.getDocument().getPDFDoc();
					const pdfdraw = await PDFNet.PDFDraw.create(92);
					const itr = await doc.getPageIterator(1);
					const currPage = await itr.current();
					const pngBuffer = await pdfdraw.exportBuffer(currPage, 'PNG');
					const urlEncodedImg = URL.createObjectURL(new Blob([pngBuffer]));
					setPdfImage(urlEncodedImg);
					// const tifBuffer = await pdfdraw.exportBuffer(currPage, 'TIFF');
				});
			});
		});
	}, []);

	return (
		<>
			<div ref={viewerRef} style={{ position: 'absolute', top: '-99999px' }}></div>
			<div
				style={{
					border: '1px solid black',
					height: '840px',
					width: '600px',
					backgroundSize: 'contain',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
					backgroundImage: `url("${pdfImage}")`,
				}}
			>
				{pdfImage ? '' : 'Loading'}
			</div>
		</>
	);
}
