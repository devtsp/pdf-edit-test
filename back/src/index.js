const express = require('express');
const cors = require('cors');
var path = require('path');

const app = express();
const { getOptDocuments } = require('./controller');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.route('/optDocuments').get(getOptDocuments);

app.listen(8080, () => console.log('Listening on http://localhost:8080'));
