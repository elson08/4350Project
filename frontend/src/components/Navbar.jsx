import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import "./Navbar.css";

const CUSTOMER_LINKS = [
    { to: "/customer/parts", label: "Parts" },
    { to: "/customer/cart", label: "Cart" },
    { to: "/customer/orders", label: "My orders" }
];

const STORE_LINKS = [
    { to: "/employee/inventory", label: "Inventory" },
    { to: "/employee/orders", label: "Orders" },
    { to: "/employee/suppliers", label: "Suppliers" },
    { to: "/employee/employees", label: "Employees" },
    { to: "/employee/reports", label: "Reports" }
];

function menuFor(pathname) {
    if (pathname.startsWith("/customer")) {
        return { mode: "customer", links: CUSTOMER_LINKS, label: "Customer menu" };
    }

    if (pathname.startsWith("/employee")) {
        return { mode: "store", links: STORE_LINKS, label: "Store menu" };
    }

    return null;
}

function Navbar({ user, onLogout }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const menu = menuFor(pathname);
    const isStoreMode = menu?.mode === "store";

    function handleLogout() {
        onLogout();
        navigate("/login");
    }

    return (
        <header className={isStoreMode ? "navbar navbar-store" : "navbar"}>
            <div className="navbar-bar">
                <span className="navbar-brand">
                    <Link to="/">Auto Parts</Link>
                </span>

                {menu && (
                    <nav className="navbar-links" aria-label={menu.label}>
                        {menu.links.map((link) => (
                            <NavLink key={link.to} to={link.to}>
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                )}

                {user && (
                    <div className="navbar-account">
                        <span>{user.storeName}</span>
                        <span>{user.name}</span>
                        <button type="button" onClick={handleLogout}>
                            Log out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Navbar;
