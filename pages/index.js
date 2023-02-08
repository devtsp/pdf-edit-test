import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const ReactPdf = dynamic(() => import('../components/reactpdf'), {
	ssr: false,
});

import PsPdfkit from '../components/pspdfkit';
import PdfTron from '../components/pdftron';
import PdfJsExpress from '../components/pdfjsexpress';
import Signature from '../components/signature';
import PdfAsImage from '../components/pdfAsImage';
import MapAcroFields from '../components/mapAcroFields';
import Pdfjs from '../components/pdfjs';
import PDFViewer from '../components/PDFViewer';
import Accordions from '../components/accordions';

export default function Home() {
	const [active, setActive] = React.useState(10);

	const BUTTONS = [
		// {
		// 	id: 0,
		// 	title: 'PDF TRON',
		// },
		// {
		// 	id: 1,
		// 	title: 'PS PDF KIT',
		// },
		// {
		// 	id: 2,
		// 	title: 'REACT PDF',
		// },
		// {
		// 	id: 3,
		// 	title: 'PDF JS EXPRESS',
		// },
		// {
		// 	id: 4,
		// 	title: 'SIGNATURE',
		// },
		// {
		// 	id: 6,
		// 	title: 'PDF AS IMAGE',
		// },
		// {
		// 	id: 7,
		// 	title: 'MAP ACRO FIELDS',
		// },
		// {
		// 	id: 8,
		// 	title: 'PDF JS',
		// },
		// {
		// 	id: 9,
		// 	title: 'PAGINATION',
		// },
		{
			id: 10,
			title: 'ACCORDIONS',
		},
	];

	return (
		<>
			<Head>
				<title>PDF LABS</title>
				<meta property="og:title" content="PDF LABS" key="title" />
				<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.228/pdf.min.js"></script>
			</Head>
			<Nav setActive={setActive} active={active} buttons={BUTTONS} />
			<Main active={active} />
		</>
	);
}

function Nav({ active, setActive, buttons }) {
	return (
		<nav style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
			{buttons.map((button) => (
				<NavButton
					key={button.id}
					id={button.id}
					title={button.title}
					active={active}
					setActive={setActive}
				/>
			))}
		</nav>
	);
}

function NavButton({ id, title, active, setActive }) {
	return (
		<span
			onClick={() => setActive(id)}
			className={'nav-links' + (active === id ? ' nav-links--active' : '')}
		>
			{title}
		</span>
	);
}

function Main({ active }) {
	switch (active) {
		case 0:
			return <PdfTron />;
		case 1:
			return <PsPdfkit />;
		case 2:
			return <ReactPdf />;
		case 3:
			return <PdfJsExpress />;
		case 4:
			return <Signature />;
		case 6:
			return <PdfAsImage />;
		case 7:
			return <MapAcroFields />;
		case 8:
			return <Pdfjs />;
		case 9:
			return <PDFViewer />;
		case 10:
			return <Accordions />;
		default:
			return null;
	}
}
