import { Link, NavLink, useLocation } from "react-router-dom";

import "./Navbar.css";

const CUSTOMER_LINKS = [
    { to: "/customer/parts", label: "Parts" },
    { to: "/customer/cart", label: "Cart" },
    { to: "/customer/orders", label: "My orders" }
];

const STORE_LINKS = [
    { to: "/employee/inventory", label: "Inventory" },
    { to: "/employee/orders", label: "Orders" },
    { to: "/employee/suppliers", label: "Suppliers" }
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

function Navbar() {
    const { pathname } = useLocation();
    const menu = menuFor(pathname);
    const isStoreMode = menu?.mode === "store";

    return (
        <header className={isStoreMode ? "navbar navbar-store" : "navbar"}>
            <div className="navbar-bar">
                <span className="navbar-brand">
                    <Link to="/">Auto Parts</Link>
                    {isStoreMode && <span className="navbar-mode">Store mode</span>}
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

                {menu && (
                    <div className="navbar-account">
                        <Link to="/login">Log out</Link>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Navbar;
