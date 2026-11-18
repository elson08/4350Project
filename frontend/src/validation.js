export function validateRegistration(name, email, password, confirmPassword) {
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
