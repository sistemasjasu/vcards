



const isDevelopment = import.meta.env.MODE === 'development';


export const API_URL = isDevelopment ? "http://localhost:3000" : "";