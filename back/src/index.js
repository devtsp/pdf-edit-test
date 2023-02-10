const express = require('express');
const cors = require('cors');

const app = express();
const { getOptDocuments } = require('./controller');

app.use(
	cors({
		origin: (origin, callback) =>
			/localhost/.test(origin) ? callback(null, true) : callback(new Error()),
	})
);
app.use(express.json());

app.route('/optDocuments').get(getOptDocuments);

app.listen(8080, () => console.log('Listening on http://localhost:8080'));
