export async function register() {
  // Accept self-signed certificates for the API proxy in development
  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}
