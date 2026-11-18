
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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

