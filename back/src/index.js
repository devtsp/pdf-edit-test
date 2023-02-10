const express = require('express');
const app = express();

const { getPdfInfo, postPdfFields } = require('./controller');

app.use(express.json());

app.route('/pdfs/:pdfId').get(getPdfInfo).post(postPdfFields);

app.listen(8080, () => console.log('Listening on http://localhost:8080'));
