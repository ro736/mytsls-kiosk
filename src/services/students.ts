/*
  File Path: src/services/students.ts
  File Description: Student lookup by TIN. Mock data for now — replace the body of findStudentByTIN with your API call.
*/
export type StudentRecord = {
  tin: string;
  name: string;
  contact: string;
  email: string;
};

const MOCK_STUDENTS: StudentRecord[] = [
  { tin: "1234567890", name: "Litia Vakacegu", contact: "9000001", email: "litia@example.com" },
  { tin: "9876543210", name: "Joseva Tuilagi", contact: "9000002", email: "joseva@example.com" },
];

export async function findStudentByTIN(tin: string): Promise<StudentRecord | null> {
  // TODO: replace with e.g. const res = await fetch(`${API_URL}/students/${tin}`)
  await new Promise((r) => setTimeout(r, 500));
  return MOCK_STUDENTS.find((s) => s.tin === tin.trim()) ?? null;
}
