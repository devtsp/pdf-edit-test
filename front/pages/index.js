import Head from 'next/head';

import { Body } from '../layouts/Body';

export default function () {
	return (
		<>
			<Head>
				<title>PDF LABS</title>
				<meta property="og:title" content="PDF LABS" key="title" />
				<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.228/pdf.min.js"></script>
			</Head>
			<Body />
		</>
	);
}
