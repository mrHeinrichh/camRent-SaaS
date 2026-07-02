/** Short human-readable booking reference derived from the order id. */
export const formatOrderRef = (orderId: string) => `#${orderId.slice(-6).toUpperCase()}`;
