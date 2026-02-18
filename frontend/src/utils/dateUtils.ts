export const isValidDate = (dateString: string): boolean => {
    // Regex to check format YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) return false;

    const [year, month, day] = dateString.split('-').map(Number);

    // Check month range
    if (month < 1 || month > 12) return false;

    // Check day range for the specific month
    const date = new Date(year, month - 1, day);

    // JavaScript Date automatically corrects invalid dates (e.g. Feb 30 -> Mar 2)
    // We check if the components match the input to verify strict validity
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
};
