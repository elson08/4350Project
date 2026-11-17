
function Page({ title, description }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

// General pages
export function Home() {
  return <Page title="Auto Parts Store" description="Welcome to our auto parts store." />;
}

export function StoreSelection() {
  return <Page title="Select a Store" description="Choose which store location you want to use." />;
}

// Customer pages
export function CustomerLogin() {
  return <Page title="Customer Sign In" description="Sign in to your customer account." />;
}

export function CustomerRegister() {
  return <Page title="Customer Registration" description="Create a customer account." />;
}

export function PartsCatalog() {
  return <Page title="Parts Catalog" description="Browse available automotive parts." />;
}

export function Cart() {
  return <Page title="Shopping Cart" description="Review your selected parts and orders." />;
}

export function Payment() {
  return <Page title="Payment" description="Complete your order payment." />;
}

export function OrderHistory() {
  return <Page title="Order History" description="View your previous orders." />;
}

// Employee pages
export function EmployeeLogin() {
  return <Page title="Employee Sign In" description="Employee account access." />;
}

export function EmployeeDashboard() {
  return <Page title="Employee Dashboard" description="Employee management portal." />;
}

export function Inventory() {
  return <Page title="Inventory Management" description="View and manage store inventory." />;
}

export function ManageOrders() {
  return <Page title="Manage Orders" description="View and manage customer orders." />;
}

// Supplier pages
export function SupplierLogin() {
  return <Page title="Supplier Sign In" description="Supplier account access." />;
}

export function SupplierDashboard() {
  return <Page title="Supplier Dashboard" description="Supplier management portal." />;
}

export function SupplierOrders() {
  return <Page title="Supplier Orders" description="View and manage supplier orders." />;
}
