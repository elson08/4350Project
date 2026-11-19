
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import bcrypt from "bcryptjs";
import { deleteData, getRecords, insertRecord } from "../services/api.js";
import { validateRegistration } from "../validation.js";

const EMAIL_IN_USE = "That email is already in use.";

async function createAccount({ table, profile, idField, accountRole, email, password }) {
    const existing = await getRecords("userAccount", { username: email });
    if (existing.length > 0) {
        throw new Error(EMAIL_IN_USE);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await insertRecord(table, profile);

    const matches = await getRecords(table, profile);
    const id = Math.max(...matches.map((row) => row[idField]));

    try {
        await insertRecord("userAccount", { username: email, passwordHash, accountRole, [idField]: id });
    } catch (error) {
        await deleteData(table, { [idField]: id });
        throw error;
    }
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
        setError("");

        const validationError = validateRegistration(name, email, password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await createAccount({
                table: "customer",
                profile: { name: name.trim(), address: address.trim(), phone: phone.trim() },
                idField: "customerID",
                accountRole: "Customer",
                email: email.trim(),
                password
            });
            alert("Customer account created successfully.");
            navigate("/login");
        } catch (registerError) {
            setError(registerError.message === EMAIL_IN_USE ? EMAIL_IN_USE : "Registration failed. Please try again.");
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
        setError("");

        if (selectedStore === null || selectedStore === undefined) {
            setError("Please select a store before registering.");
            navigate("/login");
            return;
        }

        const validationError = validateRegistration(name, email, password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await createAccount({
                table: "employee",
                profile: { storeID: Number(selectedStore), employeeName: name.trim(), managementRole: "Associate" },
                idField: "employeeID",
                accountRole: "Employee",
                email: email.trim(),
                password
            });
            alert("Employee account created successfully.");
            navigate("/login");
        } catch (registerError) {
            setError(registerError.message === EMAIL_IN_USE ? EMAIL_IN_USE : "Registration failed. Please try again.");
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
