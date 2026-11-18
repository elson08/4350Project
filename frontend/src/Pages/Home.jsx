
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="home-page">
            <h1>Auto Parts Store</h1>
            <p>Welcome! Select a store location to continue.</p>

            <Link to="/stores" className="home-button">
                Select a Store
            </Link>
        </div>
    );
}

export default Home;
