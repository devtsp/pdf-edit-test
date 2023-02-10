import React from 'react';
import dynamic from 'next/dynamic';

const Reactpdf = dynamic(() => import('./Reactpdf'), {
	ssr: false,
});
import { PdfAsImagePdftron } from './PdfAsImagePdftron';
import { PdfjsExpress } from './PdfjsExpress';
import { PdftronViewer } from './PdftronViewer';
import { Pspdfkit } from './Pspdfkit';
import { PdfjsViewer } from './PdfjsViewer';
import { Documents } from './Documents';

import { Nav } from '../components/Nav';

const BUTTONS = [
	{
		id: 0,
		title: 'DOCUMENTS',
	},
];

export function Body() {
	const [active, setActive] = React.useState(0);
	return (
		<>
			<Nav setActive={setActive} active={active} buttons={BUTTONS} />
			<div style={{ padding: '20px' }}>
				{(() => {
					switch (active) {
						case 0:
							return <Documents />;
						case 1:
							return <PdfAsImagePdftron />;
						case 2:
							return <PdfjsExpress />;
						case 3:
							return <PdftronViewer />;
						case 4:
							return <Pspdfkit />;
						case 5:
							return <Reactpdf />;
						case 6:
							return <PdfjsViewer />;
						default:
							return null;
					}
				})()}
			</div>
		</>
	);
}
