import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";

import { deleteData, getRecords, insertRecord, updateData } from "../../services/api.js";
import { validateRegistration } from "../../validation.js";

import "./Employees.css";

const ROLES = ["Associate", "Manager"];
const EMAIL_IN_USE = "That email is already in use.";

async function loadEmployees(storeID) {
    const [employees, accounts] = await Promise.all([
        getRecords("employee", { storeID }),
        getRecords("userAccount", { accountRole: "Employee" })
    ]);

    return employees.map((employee) => ({
        ...employee,
        account: accounts.find((account) => account.employeeID === employee.employeeID)
    }));
}

async function addEmployee({ storeID, name, role, email, password }) {
    const existing = await getRecords("userAccount", { username: email });
    if (existing.length > 0) {
        throw new Error(EMAIL_IN_USE);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await insertRecord("employee", { storeID, employeeName: name, managementRole: role });

    const matches = await getRecords("employee", { storeID, employeeName: name });
    const employeeID = Math.max(...matches.map((employee) => employee.employeeID));

    try {
        await insertRecord("userAccount", { username: email, passwordHash, accountRole: "Employee", employeeID });
    } catch (error) {
        await deleteData("employee", { employeeID });
        throw error;
    }
}

async function removeEmployee(employee) {
    if (employee.account) {
        await deleteData("userAccount", { userID: employee.account.userID });
    }

    await deleteData("employee", { employeeID: employee.employeeID });
}

function EmployeeRow({ employee, isSelf, onChanged }) {
    const [name, setName] = useState(employee.employeeName);
    const [role, setRole] = useState(employee.managementRole);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");

    const isChanged = name.trim() !== employee.employeeName || role !== employee.managementRole;

    async function handleSave() {
        setError("");
        setWorking(true);
        try {
            await updateData("employee", {
                conditions: { employeeID: employee.employeeID },
                updates: { employeeName: name.trim(), managementRole: role }
            });
            onChanged(`Saved ${name.trim()}.`);
        } catch {
            setError("Couldn't save.");
            setWorking(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm(`Delete ${employee.employeeName}?`)) {
            return;
        }

        setError("");
        setWorking(true);
        try {
            await removeEmployee(employee);
            onChanged(`Deleted ${employee.employeeName}.`);
        } catch {
            setError("Couldn't delete.");
            setWorking(false);
        }
    }

    return (
        <tr>
            <td>{employee.employeeID}</td>
            <td>
                <input
                    className="employees-input"
                    value={name}
                    aria-label={`Name of ${employee.employeeName}`}
                    onChange={(event) => setName(event.target.value)}
                />
                {error && <div className="employees-error">{error}</div>}
            </td>
            <td>
                <select
                    className="employees-input"
                    value={role}
                    aria-label={`Role of ${employee.employeeName}`}
                    onChange={(event) => setRole(event.target.value)}
                >
                    {ROLES.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </td>
            <td>{employee.account?.username}</td>
            <td>
                <div className="employees-actions">
                    <button
                        type="button"
                        className="button"
                        disabled={!isChanged || name.trim() === "" || working}
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    {!isSelf && (
                        <button type="button" className="button" disabled={working} onClick={handleDelete}>
                            Delete
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function AddEmployeeForm({ storeID, onAdded }) {
    const [name, setName] = useState("");
    const [role, setRole] = useState(ROLES[0]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const validationError = validateRegistration(name, email, password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setAdding(true);
        try {
            await addEmployee({ storeID, name: name.trim(), role, email: email.trim(), password });
            onAdded(`Added ${name.trim()}.`);
            setName("");
            setRole(ROLES[0]);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (addError) {
            setError(addError.message === EMAIL_IN_USE ? EMAIL_IN_USE : "Couldn't add employee.");
        } finally {
            setAdding(false);
        }
    }

    return (
        <form className="card employees-add" onSubmit={handleSubmit} aria-labelledby="employees-add-title">
            <h2 id="employees-add-title">Add an employee</h2>
            <div className="field">
                <label htmlFor="employee-name">Name</label>
                <input id="employee-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="field">
                <label htmlFor="employee-role">Role</label>
                <select id="employee-role" value={role} onChange={(event) => setRole(event.target.value)}>
                    {ROLES.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <div className="field">
                <label htmlFor="employee-email">Email</label>
                <input
                    id="employee-email"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
            </div>
            <div className="field">
                <label htmlFor="employee-password">Password</label>
                <input
                    id="employee-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            </div>
            <div className="field">
                <label htmlFor="employee-confirm">Confirm password</label>
                <input
                    id="employee-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                />
            </div>
            {error && (
                <p className="message message-error" role="alert">
                    {error}
                </p>
            )}
            <button type="submit" className="button button-primary" disabled={adding}>
                {adding ? "Adding..." : "Add employee"}
            </button>
        </form>
    );
}

function Employees({ selectedStore, user }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [message, setMessage] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        loadEmployees(selectedStore)
            .then((loadedEmployees) => {
                if (isCurrent) {
                    setEmployees(loadedEmployees);
                }
            })
            .catch(() => {
                if (isCurrent) {
                    setLoadError("Couldn't load employees.");
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [selectedStore, reloadCount]);

    if (loading) {
        return <p className="muted">Loading...</p>;
    }

    if (loadError) {
        return <p className="message message-error">{loadError}</p>;
    }

    function handleChange(text) {
        setMessage(text);
        setReloadCount((count) => count + 1);
    }

    return (
        <div className="employees">
            {message && (
                <p className="message message-success" role="status">
                    {message}
                </p>
            )}

            <div className="employees-columns">
                <section className="card employees-list" aria-label="Employees">
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Email</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee) => {
                                    const key = `${employee.employeeID}:${employee.employeeName}:${employee.managementRole}`;

                                    return (
                                        <EmployeeRow
                                            key={key}
                                            employee={employee}
                                            isSelf={employee.employeeID === user.employeeID}
                                            onChanged={handleChange}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <AddEmployeeForm storeID={selectedStore} onAdded={handleChange} />
            </div>
        </div>
    );
}

export default Employees;
