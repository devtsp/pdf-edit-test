const db = {
	_db: {
		optDocuments: [
			{
				Id: '0',
				DocumentName: 'Acknowledgement HIPAA.pdf',
				DocumentAlias: 'Acknowledgement HIPAA',
			},
		],
	},

	getById(table, id) {
		return this._db[table].find(({ Id }) => Id === id);
	},
};

module.exports = { db };
