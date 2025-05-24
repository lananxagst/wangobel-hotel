import { cloudinary } from '../config/cloudinary.js';

export const uploadImage = async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide an image' 
            });
        }

        // Upload image to cloudinary
        const result = await cloudinary.uploader.upload(image, {
            folder: 'wangobel-rooms',
            use_filename: true
        });

        res.json({ 
            success: true, 
            url: result.secure_url 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading image' 
        });
    }
};
