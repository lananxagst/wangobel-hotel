/**
 * Format price to IDR with K suffix
 * @param {number} amount - Amount in rupiah (e.g., 100)
 * @returns {string} Formatted string (e.g., "IDR 100K")
 */
export const formatToIDR = (amount) => {
  // Jika amount sudah dalam ribuan, langsung tampilkan
  // Jika amount dalam satuan rupiah biasa (100 = 100rb), kalikan 1000
  return `IDR ${amount}K`;
};

/**
 * Convert display amount to Midtrans amount
 * @param {number} amount - Amount in thousands (e.g., 100 for 100K)
 * @returns {number} Amount in rupiah (e.g., 100000)
 */
export const convertToMidtransAmount = (amount) => {
  return amount * 1000; // Convert thousands to actual rupiah
};
