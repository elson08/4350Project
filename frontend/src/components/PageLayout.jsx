import Navbar from "./Navbar.jsx";

import "./PageLayout.css";

function PageLayout({ user, onLogout, children }) {
    return (
        <>
            <Navbar user={user} onLogout={onLogout} />
            <main className="page">{children}</main>
        </>
    );
}

export default PageLayout;
