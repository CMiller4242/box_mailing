import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Box Mailing</span>
        <div className="nav-links">
          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              'nav-link' + (isActive ? ' active' : '')
            }
          >
            Mailing Jobs
          </NavLink>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
