const db = {
	_db: {
		optDocuments: [
			{
				Id: '0',
				DocumentName: 'Acknowledgement HIPAA.pdf',
				DocumentAlias: 'Acknowledgement HIPAA',
			},
			{
				Id: '1',
				DocumentName: 'Consent for Treatment.pdf',
				DocumentAlias: 'Consent for Treatment',
			},
			{
				Id: '2',
				DocumentName: 'OCIRT CRISIS PLAN.pdf',
				DocumentAlias: 'OCIRT Crisis Plan',
			},
			{
				Id: '3',
				DocumentName: 'Recipient Rights Signature.pdf',
				DocumentAlias: 'Recipient Rights Signature',
			},
			{
				Id: '4',
				DocumentName:
					'Consent_to_Share_Behavioral_Health_Information_for_Care_Coordination_Purposes_641573_7.pdf',
				DocumentAlias: 'Consent to Share Behavioral Health Information',
			},
		],
	},

	getById(table, id) {
		return this._db[table].find(({ Id }) => Id === id);
	},
};

module.exports = { db };
