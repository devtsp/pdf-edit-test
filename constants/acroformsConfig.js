export const ACROFORMS_CONFIG = {
	CONSENT_SHARE_BEHAVIORAL_HEALTH_INFO: {
		documentName: 'Consent to Share Behavioral Health Information for Care Coordination Purposes',
		// This is hardcoded for now, because we don't found a way to track page acrofield with pdf-lib
		acroFieldsConfig: [
			{
				page: 1,
				fieldsRange: [0, 4],
			},
			{
				page: 2,
				fieldsRange: [5, 21],
			},
			{
				page: 3,
				fieldsRange: [22, 38],
			},
			{
				page: 4,
				fieldsRange: [39, 54],
			},
		],
	},
	ACKNOWLEDGEMENT_HIPAA: {
		documentName: 'Acknowledgement HIPAA',
	},
	CONSENT_FOR_TREATMENT: {
		documentName: 'Consent for Treatment',
	},
	OCIRT_CRISIS_PLAN: {
		documentName: 'OCIRT CRISIS PLAN',
	},
	RECIPIENT_RIGHTS_SIGNATURE: {
		documentName: 'Recipient Rights Signature',
	},
};
