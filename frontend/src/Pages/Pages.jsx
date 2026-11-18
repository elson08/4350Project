
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { getRecords, insertRecord } from "../services/api.js";

function Page({ title, description }) {
    return (
        <div>
            <h1>{title}</h1>
            <p>{description}</p>
        </div>
    );
}

// Store Selection
export function StoreSelection({ setSelectedStore }) {
    const navigate = useNavigate();

    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadStores() {
        setLoading(true);
        setError("");

        try {
            const storeRecords = await getRecords("store");
            setStores(storeRecords);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
    let isMounted = true;

    async function fetchStores() {
        try {
            const storeData = await getRecords("store");

            if (isMounted) {
                setStores(storeData);
                setError("");
            }
        } catch (error) {
            if (isMounted) {
                setError(error.message);
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    }

    fetchStores();

    return () => {
        isMounted = false;
    };
}, []);

    function chooseStore(storeID) {
        setSelectedStore(storeID);
        navigate("/login");
    }

    return (
        <div className="store-selection">
            <h1>Select a Store</h1>
            <p>Choose the store location you want to use.</p>

            {loading && <p>Loading stores...</p>}

            {error && (
                <div>
                    <p>{error}</p>
                    <button onClick={loadStores}>Retry</button>
                </div>
            )}

            {!loading && !error && stores.length === 0 && (
                <p>No stores were found.</p>
            )}

            {!loading && !error && stores.map((store) => (
                <button
                    key={store.storeID}
                    onClick={() => chooseStore(store.storeID)}
                >
                    {store.storeName}
                    <br />
                    {store.address}
                </button>
            ))}

            <br />
            <Link to="/">Return Home</Link>
        </div>
    );
}

// Shared Login
export function Login({ selectedStore }) {
    const [accountType, setAccountType] = useState("customer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleLogin(event) {
        event.preventDefault();
        setError("");

        if (selectedStore === null || selectedStore === undefined) {
            setError("Please select a store first.");
            navigate("/stores");
            return;
        }

        console.log("Store selected")
        setLoading(true);

        try {
            console.log("Getting account")
            const accounts = await getRecords("userAccount", {
                username: email.trim()
            });

            if (!accounts || accounts.length === 0) {
                throw new Error("No account was found with that email.");
            }

            console.log("Account found")

            const account = accounts[0];

            if (account.accountRole.toLowerCase() !== accountType) {
                throw new Error(
                    `This account is not registered as a ${accountType}.`
                );
            }

            const passwordMatches = await bcrypt.compare(
                password,
                account.passwordHash
            );
            console.log("Password matches")

            if (!passwordMatches) {
                console.log("Incorrect email or password")
                throw new Error("Incorrect email or password.");
            }

            console.log("Getting customer account")
            if (accountType === "customer") {
                const customers = await getRecords("customer", {
                    customerID: account.customerID
                });

                if (!customers || customers.length === 0) {
                    throw new Error(
                        "Your account exists, but its customer profile could not be found."
                    );
                }

                console.log("Found customer account")

                navigate("/customer/parts");
            } else {
                console.log("Getting employee account")
                const employees = await getRecords("employee", {
                    employeeID: account.employeeID
                });

                if (!employees || employees.length === 0) {
                    throw new Error(
                        "Your account exists, but its employee profile could not be found."
                    );
                }
                console.log("Found employee account") 

                const employee = employees[0];

                if (Number(employee.storeID) !== Number(selectedStore)) {
                    throw new Error(
                        "You are not assigned to the selected store. Please select your assigned location."
                    );
                }

                navigate("/employee/inventory");
            }
        } catch (error) {
            setError(error.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function handleRegister() {
        if (accountType === "customer") {
            navigate("/register/customer");
        } else {
            navigate("/register/employee");
        }
    }

    return (
        <div className="login-page">
            <h1>Account Login</h1>
            <p>Selected Store ID: {selectedStore}</p>

            <form onSubmit={handleLogin}>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <label>Account Type</label>
                <select
                    value={accountType}
                    onChange={(event) => setAccountType(event.target.value)}
                >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                </select>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                <button type="button" onClick={handleRegister}>
                    Register
                </button>
            </form>

            <Link to="/stores">Change Store</Link>
        </div>
    );
}

// Shared registration validation
function validateRegistration(name, email, password, confirmPassword) {
    if (!name.trim()) {
        return "Name is required.";
    }

    if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(name.trim())) {
        return "Name can only contain letters, spaces, apostrophes, and hyphens.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Please enter a valid email address.";
    }

    if (password.length < 8 || password.length > 32) {
        return "Password must be between 8 and 32 characters.";
    }

    if (/\s|-/.test(password)) {
        return "Password cannot contain spaces or hyphens.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password needs at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password needs at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password needs at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return "Password needs at least one special character.";
    }

    if (password !== confirmPassword) {
        return "Passwords do not match.";
    }

    return "";
}

// Customer Registration
export function CustomerRegister() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRegister(event) {
        event.preventDefault();

        console.log("CUSTOMER REGISTER CALLED");

        setError("");

        console.log("Validating")
        const validationError = validateRegistration(
            name,
            email,
            password,
            confirmPassword
        );

        if (validationError) {
            console.log("Validation failed:", validationError);
            setError(validationError);
            return;
        }
        console.log("Validation Complete")

        setLoading(true);

        try {
            console.log("Starting password hash");

            const passwordHash = await bcrypt.hash(password, 12);

            console.log("Password hash completed");

            // Create customer
            console.log("Attempting to create customer profile");
            await insertRecord("customer", {
                name: name.trim(),
                address: address.trim(),
                phone: phone.trim()
            });
            // End

            // Retrieve the newly created account so we can get its customerID
            const accounts = await getRecords("customer", {
                name: name.trim()
            });

            if (!accounts || accounts.length === 0) {
                throw new Error(
                    "Your account was created, but we could not retrieve its user ID. The customer profile was not created."
                );
            }

            const account = accounts[0];
            // End

            {/* Create userAccount */}
            console.log("Attempting to register account:", email);
            await insertRecord("userAccount", {
                username: email.trim(),
                passwordHash: passwordHash,
                accountRole: "Customer",
                customerID: account.customerID
            });
            console.log("Account insertion completed");
            {/* End */}

            alert("Customer account created successfully.");
            navigate("/login");
        } catch (error) {
            console.error("Registration failed:", error);

            setError(
                error.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <h1>Customer Registration</h1>

            <form onSubmit={handleRegister}>
                <label>Full Name</label>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                />

                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label>Address</label>
                <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                />

                <label>Phone</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <label>Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                        setConfirmPassword(event.target.value)
                    }
                    required
                />

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Register"}
                </button>
            </form>

            <Link to="/login">Return to Login</Link>
        </div>
    );
}

// Employee Registration
export function EmployeeRegister({ selectedStore }) {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRegister(event) {
        event.preventDefault();

        console.log("EMPLOYEE REGISTER CALLED");
        console.log("Selected store:", selectedStore);
        
        setError("");

        if (selectedStore === null || selectedStore === undefined) {
            console.log("No store selected");
            setError("Please select a store before registering.");
            navigate("/stores");
            return;
        }

        console.log("Validating registration")
        const validationError = validateRegistration(
            name,
            email,
            password,
            confirmPassword
        );

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        console.log("Trying password hashing")
        try {
            console.log("Starting password hash");

            const passwordHash = await bcrypt.hash(password, 12);

            console.log("Password hash completed");

            {/* Create employee */}
            console.log("About to send POST request");
            await insertRecord("employee", {
                storeID: Number(selectedStore),
                employeeName: name.trim(),
                managementRole: "Associate"
            });
            console.log("Created employee")
            {/* End */}

            {/* Get empplyeeID */}
            console.log("Finding employee")
            const accounts = await getRecords("employee", {
                employeeName: name.trim()
            });

            if (!accounts || accounts.length === 0) {
                throw new Error(
                    "Your account was created, but we could not retrieve its user ID. The employee profile was not created."
                );
            }
            console.log("Found employee")
            {/* End */}

	        const account = accounts[0];

            {/* userAccount Creation */}
            console.log("About to send POST request");
            await insertRecord("userAccount", {
                username: email.trim(),
                passwordHash: passwordHash,
                accountRole: "Employee",
                employeeID: account.employeeID
            });
            {/* End */}

            alert("Employee account created successfully.");
            navigate("/login");
        } catch (error) {
            setError(
                error.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <h1>Employee Registration</h1>
            <p>Assigned Store ID: {selectedStore}</p>

            <form onSubmit={handleRegister}>
                <label>Full Name</label>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                />

                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                <label>Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                        setConfirmPassword(event.target.value)
                    }
                    required
                />

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Register"}
                </button>
            </form>

            <Link to="/login">Return to Login</Link>
        </div>
    );
}

// Customer Pages
export function PartsCatalog({ selectedStore }) {
    if (selectedStore == null) {
        return (
            <section>
                <h1>Parts Catalog</h1>
                <Link to="/stores">Choose a store to view its parts</Link>
            </section>
        );
    }

    return <StorePartsCatalog key={selectedStore} storeID={selectedStore} />;
}

function StorePartsCatalog({ storeID }) {
    const [catalog, setCatalog] = useState(null);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;

        Promise.all([
            getRecords("inventory", { storeID }),
            getRecords("part"),
        ]).then(([inventory, parts]) => {
            if (!active) return;

            const stock = new Map();
            for (const item of inventory) {
                stock.set(item.partID, (stock.get(item.partID) ?? 0) + item.quantity);
            }
            setCatalog(parts.filter((part) => stock.has(part.partID)).map((part) => ({
                ...part,
                quantity: stock.get(part.partID),
            })));
        }).catch(() => {
            if (active) setError("Could not load parts for this store.");
        });

        return () => { active = false; };
    }, [storeID, attempt]);

    const search = query.trim().toLowerCase();
    const visibleParts = catalog?.filter((part) =>
        [part.partName, part.category, part.condition].some((value) =>
            String(value ?? "").toLowerCase().includes(search)
        )
    );
    const priceFormatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    });

    return (
        <section className="store-selection">
            <h1>Parts Catalog</h1>
            <Link to="/stores">Change store</Link>
            {!catalog && !error && <p role="status">Loading parts…</p>}
            {error && (
                <div>
                    <p role="alert">{error}</p>
                    <button type="button" onClick={() => {
                        setError("");
                        setAttempt(attempt + 1);
                    }}>Retry</button>
                </div>
            )}
            {catalog?.length === 0 && <p>This store has no parts listed.</p>}
            {catalog?.length > 0 && (
                <>
                    <p>
                        <label>
                            Search parts{" "}
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </label>
                    </p>
                    {visibleParts.length === 0 ? (
                        <p role="status">No parts match your search.</p>
                    ) : (
                        <ul>
                            {visibleParts.map((part) => (
                                <li key={part.partID}>
                                    <strong>{part.partName}</strong>
                                    {" · "}{part.category}
                                    {" · "}{part.condition}
                                    {" · "}{priceFormatter.format(part.unitPrice)}
                                    {" · "}{part.quantity > 0 ? `${part.quantity} in stock` : "Out of stock"}
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
}

export function Cart() {
    return <Page title="Shopping Cart" description="Review your selected parts." />;
}

export function PaymentOrderHistory() {
    return (
        <Page
            title="Payment & Order History"
            description="Review your orders and payment information."
        />
    );
}

// Employee Pages
export function Inventory() {
    return <Page title="Inventory Management" description="View and manage store inventory." />;
}

export function ManageOrders() {
    return <Page title="Manage Orders" description="View and manage customer orders." />;
}

export function Suppliers() {
    return <Page title="Supplier Management" description="View and manage suppliers." />;
}

