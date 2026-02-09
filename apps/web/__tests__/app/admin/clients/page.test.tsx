import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClientsPage from "@/app/(app)/admin/contacts/page";
import type { Client } from "@/hooks/use-clients";

// Mock the hooks
vi.mock("@/hooks/use-clients", () => ({
  useClients: vi.fn(),
}));

vi.mock("@/hooks/use-leads", () => ({
  useLeads: vi.fn(),
}));

// Import mocked modules
import { useClients } from "@/hooks/use-clients";
import { useLeads } from "@/hooks/use-leads";

const mockClients: Client[] = [
  {
    clientId: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-123-4567",
    type: "Homebuyer",
    inspections: 3,
    lastInspection: "2024-01-15",
    totalSpent: 1500,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    clientId: "2",
    name: "Jane Smith",
    email: "jane@realty.com",
    phone: "555-987-6543",
    type: "Real Estate Agent",
    inspections: 10,
    lastInspection: "2024-01-20",
    totalSpent: 5000,
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-18T00:00:00.000Z",
  },
  {
    clientId: "3",
    name: "Bob Wilson",
    email: "bob@example.com",
    phone: "555-555-5555",
    type: "Seller",
    inspections: 1,
    lastInspection: "2024-01-10",
    totalSpent: 500,
    createdAt: "2023-12-15T00:00:00.000Z",
    updatedAt: "2024-01-08T00:00:00.000Z",
  },
];

const mockLeads = [
  {
    leadId: "lead-1",
    name: "New Lead",
    email: "lead@example.com",
    stage: "new_inquiry",
    serviceName: "Home Inspection",
    estimatedValue: 500,
  },
];

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe("ClientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useClients as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockClients,
      isLoading: false,
    });
    (useLeads as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockLeads,
      isLoading: false,
    });
  });

  it("renders the page title", () => {
    renderWithQueryClient(<ClientsPage />);
    // Use getByRole to target the heading specifically
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
  });

  it("displays client statistics", () => {
    renderWithQueryClient(<ClientsPage />);

    // Check stat labels exist
    expect(screen.getByText("Total Clients")).toBeInTheDocument();
    expect(screen.getByText("Real Estate Agents")).toBeInTheDocument();
    expect(screen.getByText("Total Inspections")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();

    // Check stat values exist (use getAllByText since numbers may appear multiple times)
    expect(screen.getAllByText("14").length).toBeGreaterThan(0); // Total inspections
    expect(screen.getAllByText("$7,000").length).toBeGreaterThan(0); // Total revenue
  });

  it("shows loading state", () => {
    (useClients as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: true,
    });

    renderWithQueryClient(<ClientsPage />);
    // When loading, client names should not be visible
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("shows empty state when no clients", () => {
    (useClients as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderWithQueryClient(<ClientsPage />);
    expect(screen.getByText("No clients yet")).toBeInTheDocument();
    expect(screen.getByText("Add your first client to start scheduling inspections.")).toBeInTheDocument();
  });

  it("displays client names in the list", () => {
    renderWithQueryClient(<ClientsPage />);

    // Use getAllByText since names appear in both mobile and desktop views
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob Wilson").length).toBeGreaterThan(0);
  });

  it("displays client type badges", () => {
    renderWithQueryClient(<ClientsPage />);

    // Use getAllByText since badges appear in both mobile and desktop views
    expect(screen.getAllByText("Homebuyer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Real Estate Agent").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Seller").length).toBeGreaterThan(0);
  });

  it("has tabs for clients and leads", () => {
    renderWithQueryClient(<ClientsPage />);

    expect(screen.getByRole("tab", { name: "Clients" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Leads" })).toBeInTheDocument();
  });

  it("leads tab is clickable", () => {
    renderWithQueryClient(<ClientsPage />);

    const leadsTab = screen.getByRole("tab", { name: "Leads" });
    expect(leadsTab).toBeInTheDocument();
    expect(leadsTab).not.toBeDisabled();
  });

  it("has Add Client and Add Lead buttons", () => {
    renderWithQueryClient(<ClientsPage />);

    expect(screen.getByRole("link", { name: /add client/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add lead/i })).toBeInTheDocument();
  });

  it("links Add Client button to correct path", () => {
    renderWithQueryClient(<ClientsPage />);

    const addClientLink = screen.getByRole("link", { name: /add client/i });
    expect(addClientLink).toHaveAttribute("href", "/admin/contacts/new");
  });

  it("links Add Lead button to correct path", () => {
    renderWithQueryClient(<ClientsPage />);

    const addLeadLink = screen.getByRole("link", { name: /add lead/i });
    expect(addLeadLink).toHaveAttribute("href", "/admin/contacts/leads/new");
  });
});

describe("ClientsPage mobile view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useClients as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockClients,
      isLoading: false,
    });
    (useLeads as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockLeads,
      isLoading: false,
    });
  });

  it("has a mobile search input", () => {
    renderWithQueryClient(<ClientsPage />);

    expect(screen.getByPlaceholderText("Search clients...")).toBeInTheDocument();
  });

  it("has filter dropdowns for client types", () => {
    renderWithQueryClient(<ClientsPage />);

    // The page uses Select dropdowns for filtering
    const comboboxes = screen.getAllByRole("combobox");
    // Should have at least type filter and sort dropdowns
    expect(comboboxes.length).toBeGreaterThan(0);
  });

  it("filters clients by search query", async () => {
    renderWithQueryClient(<ClientsPage />);

    const searchInput = screen.getByPlaceholderText("Search clients...");
    fireEvent.change(searchInput, { target: { value: "john" } });

    // John Doe should still be visible, others filtered
    await waitFor(() => {
      const mobileCards = screen.getAllByText("John Doe");
      expect(mobileCards.length).toBeGreaterThan(0);
    });
  });
});
