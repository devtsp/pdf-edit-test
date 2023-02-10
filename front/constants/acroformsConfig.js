export const ACROFORMS_CONFIG = [
	{
		documentAlias: 'Consent to Share Behavioral Health Information',
		// This is hardcoded for now, because we don't found a way to track page acrofield with pdf-lib
		acrofieldsRanges: [
			{
				page: 1,
				fieldsRanges: [0, 4],
			},
			{
				page: 2,
				fieldsRanges: [5, 21],
			},
			{
				page: 3,
				fieldsRanges: [22, 38],
			},
			{
				page: 4,
				fieldsRanges: [39, 54],
			},
		],
	},
	{
		documentAlias: 'Acknowledgement HIPAA',
	},
	{
		documentAlias: 'Consent for Treatment',
	},
	{
		documentAlias: 'OCIRT Crisis Plan',
	},
	{
		documentAlias: 'Recipient Rights Signature',
	},
];
