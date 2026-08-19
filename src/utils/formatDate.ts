export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year.slice(-2)}`;
  }
  return dateString;
};
