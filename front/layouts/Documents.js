import React from 'react';

import { Accordion } from '../components/Accordion';
import { PdfEditor } from '../components/PdfEditor';

export function Documents() {
	const { optDocuments, expanded, setExpanded } = useDocuments();

	if (optDocuments.length) {
		return optDocuments.map((optDocument, i) => (
			<Accordion
				key={i}
				title={optDocument.DocumentAlias}
				panelKey={i}
				setExpanded={setExpanded}
				expanded={expanded}
				controlled
			>
				<PdfEditor
					handleSubmit={() => {
						alert('Submitting');
						setExpanded(i + 1);
					}}
					optDocument={optDocument}
				/>
			</Accordion>
		));
	}
}

function useDocuments() {
	const [optDocuments, setOptDocuments] = React.useState([]);
	const [expanded, setExpanded] = React.useState(4);

	React.useEffect(() => {
		async function fetchOptDocuments() {
			try {
				const optDocuments = await (await fetch('http://localhost:8080/optDocuments')).json();
				setOptDocuments(optDocuments);
			} catch (error) {
				console.log(error);
			}
		}

		fetchOptDocuments();
	}, []);

	return {
		optDocuments,
		setOptDocuments,
		expanded,
		setExpanded,
	};
}
