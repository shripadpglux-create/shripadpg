export function generateCustomerCredentials(name: string, phone: string): { customerId: string; customerPassword: string } {
  const cleanLetters = (name || "Resident").replace(/[^a-zA-Z]/g, "");
  const cleanPhone = (phone || "0000000000").replace(/\D/g, "");

  const first3 = cleanLetters.slice(0, 3).padEnd(3, "X");
  const last3Phone = cleanPhone.length >= 3 ? cleanPhone.slice(-3) : cleanPhone.padStart(3, "0");
  const customerId = `${first3}${last3Phone}`;

  const letters3and4 = cleanLetters.length >= 4 
    ? cleanLetters.slice(2, 4) 
    : cleanLetters.length >= 3 
      ? `${cleanLetters.slice(2, 3)}x` 
      : "pg";
  
  const digits4to7 = cleanPhone.length >= 7 
    ? cleanPhone.slice(3, 7) 
    : cleanPhone.padEnd(7, "0").slice(3, 7);

  const customerPassword = `${letters3and4}${digits4to7}`;

  return { customerId, customerPassword };
}
