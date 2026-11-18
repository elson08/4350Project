import Navbar from "./Navbar.jsx";

import "./PageLayout.css";

function PageLayout({ children }) {
    return (
        <>
            <Navbar />
            <main className="page">{children}</main>
        </>
    );
}

export default PageLayout;
