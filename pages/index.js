import React from 'react';
import dynamic from 'next/dynamic';

const ReactPdf = dynamic(() => import('../components/reactpdf'), {
	ssr: false,
});

import PsPdfkit from '../components/pspdfkit';
import PdfTron from '../components/pdftron';
import PdfJsExpress from '../components/pdfjsexpress';
import Canvas from '../components/canvas';

export default function Home() {
	const [active, setActive] = React.useState(null);

	const BUTTONS = [
		{
			id: 0,
			title: 'PDF TRON',
		},
		{
			id: 1,
			title: 'PS PDF KIT',
		},
		{
			id: 2,
			title: 'REACT PDF',
		},
		{
			id: 3,
			title: 'PDF JS EXPRESS',
		},
		{
			id: 4,
			title: 'CANVAS',
		},
	];

	return (
		<>
			<Nav setActive={setActive} active={active} buttons={BUTTONS} />
			<Main active={active} />
		</>
	);
}

function Nav({ active, setActive, buttons }) {
	return (
		<nav style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
			{buttons.map(button => (
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
			return <Canvas />;
		default:
			return null;
	}
}
