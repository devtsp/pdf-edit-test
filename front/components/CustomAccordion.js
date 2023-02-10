import React from 'react';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { Box, Typography } from '@mui/material';

const Accordion = styled((props) => (
	<MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
	border: `1px solid ${theme.palette.divider}`,
	'&:not(:last-child)': {
		borderBottom: 0,
	},
	'&:before': {
		display: 'none',
	},
}));

const AccordionSummary = styled((props) => (
	<MuiAccordionSummary
		expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
		{...props}
	/>
))(({ theme }) => ({
	backgroundColor:
		theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
	flexDirection: 'row-reverse',
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(90deg)',
	},
	'& .MuiAccordionSummary-content': {
		marginLeft: theme.spacing(1),
	},
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
	padding: theme.spacing(0),
	borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

export function CustomAccordion({
	expanded,
	setExpanded,
	controlled,
	sx,
	disabled,
	panelKey,
	title,
	children,
}) {
	let [_expanded, _setExpanded] = React.useState(false);

	if (controlled) {
		// IF CONTROLLED, USE STATE DRILLED FROM PROPS
		_expanded = expanded;
		_setExpanded = setExpanded;
	}

	const handleChange = (panelKey) => (event, newExpanded) => {
		_setExpanded(newExpanded ? panelKey : null);
	};

	return (
		<Box sx={sx}>
			<Accordion
				disabled={disabled}
				expanded={_expanded === panelKey}
				onChange={handleChange(panelKey)}
				TransitionProps={{ unmountOnExit: true }}
			>
				<AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
					<Typography>{title}</Typography>
				</AccordionSummary>
				<AccordionDetails>{children}</AccordionDetails>
			</Accordion>
		</Box>
	);
}
