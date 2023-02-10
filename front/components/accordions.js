import React from 'react';

import CustomAccordion from './CustomAccordion';
import PDFViewer from './PDFViewer';

import { ACROFORMS_CONFIG } from '../constants/acroformsConfig';

export default function Accordions() {
	return (
		<div style={{ padding: '20px' }}>
			{Object.values(ACROFORMS_CONFIG).map((config, i) => {
				return (
					<CustomAccordion key={i} title={config.documentName} panelKey={i}>
						<PDFViewer key={Math.random()} docConfig={config} />
					</CustomAccordion>
				);
			})}
		</div>
	);
}
