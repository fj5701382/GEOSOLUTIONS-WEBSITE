// Mock Users Data - GEO ACADEMY Portal
const MOCK_USERS = [
  {
    id: "admin-001",
    role: "admin",
    fullName: "Super Administrator",
    identifier: "ADMIN123",
    email: "admin@geoacademy.edu",
    password: "adminpass",
    status: "approved",
    createdAt: "2024-01-01T00:00:00.000Z",
    avatar: "SA"
  },
  {
    id: "teacher-001",
    role: "teacher",
    fullName: "Dr. Sarah Johnson",
    identifier: "sarah.johnson@geoacademy.edu",
    email: "sarah.johnson@geoacademy.edu",
    subject: "Mathematics",
    password: "teacher123",
    status: "approved",
    createdAt: "2024-01-05T00:00:00.000Z",
    avatar: "SJ"
  },
  {
    id: "student-001",
    role: "student",
    fullName: "Michael Adeyemi",
    identifier: "GEO/2024/001",
    email: "m.adeyemi@geoacademy.edu",
    password: "student123",
    status: "approved",
    createdAt: "2024-01-10T00:00:00.000Z",
    avatar: "MA"
  },
  {
    id: "student-002",
    role: "student",
    fullName: "Amara Okafor",
    identifier: "GEO/2024/002",
    email: "a.okafor@geoacademy.edu",
    password: "student456",
    status: "pending",
    createdAt: "2024-02-15T00:00:00.000Z",
    avatar: "AO"
  }
];

function seedMockUsers() {
  const existing = localStorage.getItem("geo_users");
  if (!existing) {
    localStorage.setItem("geo_users", JSON.stringify(MOCK_USERS));
    console.log("GEO ACADEMY: Mock users seeded.");
  }
}

seedMockUsers();
