export function NavLink({ id, title, active, setActive }) {
	return (
		<span
			onClick={() => setActive(id)}
			className={'nav-links' + (active === id ? ' nav-links--active' : '')}
		>
			{title}
		</span>
	);
}
