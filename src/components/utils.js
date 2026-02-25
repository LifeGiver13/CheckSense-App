export function formatProgressDate(dateString) {
  if (!dateString) return "Not attempted"; // fallback if no date
  try {
    const date = new Date(dateString);

    // Check if date is invalid
    if (isNaN(date.getTime())) return "Invalid date";

    // Options for formatting
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    return date.toLocaleString(undefined, options);
  } catch (error) {
    console.warn("Failed to parse date:", dateString, error);
    return "Invalid date";
  }
}