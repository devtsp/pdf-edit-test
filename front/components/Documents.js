import React from 'react';

import CustomAccordion from './CustomAccordion';
import CustomPdfEditor from './CustomPdfEditor';

export function Documents() {
	const [optDocuments, setOptDocuments] = React.useState([]);
	const [expanded, setExpanded] = React.useState(0);

	if (optDocuments.length) {
		return optDocuments.map((optDocument, i) => (
			<CustomAccordion
				key={i}
				title={optDocument.DocumentAlias}
				panelKey={i}
				setExpanded={setExpanded}
				expanded={expanded}
				controlled
			>
				<CustomPdfEditor
					handleSubmit={() => {
						alert('Submitting');
						setExpanded(i + 1);
					}}
					optDocument={optDocument}
				/>
			</CustomAccordion>
		));
	}
}
