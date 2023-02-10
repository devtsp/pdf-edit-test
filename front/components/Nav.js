import { NavLink } from './NavLink';

export function Nav({ active, setActive, buttons }) {
	return (
		<nav style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
			{buttons.map((button) => (
				<NavLink
					key={button.id}
					id={button.id}
					title={button.title}
					active={active}
					setActive={setActive}
				/>
			))}
		</nav>
	);
}
