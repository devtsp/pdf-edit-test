import React from 'react';
import Head from 'next/head';
// import dynamic from 'next/dynamic';

// const Reactpdf = dynamic(() => import('../components/Reactpdf'), {
// 	ssr: false,
// });
// import { PdfAsImagePdftron } from '../components/PdfAsImagePdftron';
// import { PdfjsExpress } from '../components/PdfjsExpress';
// import { PdftronViewer } from '../components/PdftronViewer';
// import { Pspdfkit } from '../components/Pspdfkit';
// import { Reactpdf } from '../components/Reactpdf';
import { Documents } from '../components/Documents';

export default function () {
	const [active, setActive] = React.useState(0);

	const BUTTONS = [
		{
			id: 0,
			title: 'DOCUMENTS',
		},
	];

	return (
		<>
			<Head>
				<title>PDF LABS</title>
				<meta property="og:title" content="PDF LABS" key="title" />
				{/* <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.228/pdf.min.js"></script> */}
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
			return <Documents />;
		default:
			return null;
	}
}
