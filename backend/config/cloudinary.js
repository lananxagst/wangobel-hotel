import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = () => {
    try {
        // Validate required environment variables
        if (!process.env.CLDN_NAME || !process.env.CLDN_API_KEY || !process.env.CLDN_API_SECRET) {
            throw new Error('Missing Cloudinary credentials');
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLDN_NAME,
            api_key: process.env.CLDN_API_KEY,
            api_secret: process.env.CLDN_API_SECRET
        });

        // Test configuration
        const testConfig = cloudinary.config();
        if (!testConfig.api_key) {
            throw new Error('Invalid Cloudinary configuration');
        }

        console.log('✔ Cloudinary connected');
    } catch (error) {
        console.error('❌ Cloudinary connection failed:', error.message);
        process.exit(1);
    }
};

export { cloudinary };
export default connectCloudinary;