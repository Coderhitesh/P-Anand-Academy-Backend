const { uploadImage, deleteImageFromCloudinary } = require("../utils/Cloudnary");
const Bundle = require('../Models/Bundles.Model')
const fs = require("fs")

exports.createBundle = async (req, res) => {
    try {
        const { bundleName, bundleTotalPrice, bundleDiscountPrice, bundleDisCountPercenatgae, bundleCourseId } = req.body;
        const emptyField = [];

        if (!bundleName) emptyField.push('Bundle Name');
        if (!bundleTotalPrice) emptyField.push('Bundle Total Price');
        if (!bundleDiscountPrice) emptyField.push('Bundle Discount Price');
        if (!bundleDisCountPercenatgae) emptyField.push('Bundle Discount Percentage');
        if (!bundleCourseId || bundleCourseId.length === 0) emptyField.push('Bundle Course ID');

        if (emptyField.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please fill in the following fields: ${emptyField.join(', ')}`
            });
        }

        let newBundle = new Bundle({
            bundleName,
            bundleTotalPrice,
            bundleDiscountPrice,
            bundleDisCountPercenatgae,
            bundleCourseId
        });

        // Handle image upload
        if (req.file) {
            const imgUrl = await uploadImage(req.file.path);
            const { image, public_id } = imgUrl;
            newBundle.bundleImage.url = image;
            newBundle.bundleImage.public_id = public_id;
            try {
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error("Error deleting file from local storage", error);
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Image is required."
            });
        }

        // Save the new bundle to the database
        const newBundleSave = await newBundle.save();

        if (newBundleSave) {
            return res.status(200).json({
                success: true,
                message: 'Bundle created successfully',
                data: newBundle
            });
        } else {
            await deleteImageFromCloudinary(newBundleSave.bundleImage.public_id);
            return res.status(400).json({
                success: false,
                message: 'Failed to create bundle'
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};


exports.getAllBundles = async (req, res) => {
    try {
        const allBundles = await Bundle.find()
        if (!allBundles) {
            return res.status(404).json({
                success: false,
                message: 'No bundles found'
            })
        }

        res.status(200).json({
            success: true,
            message: 'All Bundle Founded',
            data: allBundles
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}

exports.deleteSingleBundle = async (req, res) => {
    try {
        const id = req.params._id;

        // Find the bundle by ID
        const bundle = await Bundle.findByIdAndDelete(id);
        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: 'Bundle not found',
            });
        }

        // Delete the associated image from Cloudinary
        if (bundle.bundleImage && bundle.bundleImage.public_id) {
            try {
                await deleteImageFromCloudinary(bundle.bundleImage.public_id);
            } catch (error) {
                console.error("Error deleting image from Cloudinary", error);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Bundle deleted successfully',
            data: bundle
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

exports.updateBundle = async (req, res) => {
    try {
        const data = await Bundle.findOne({ _id: req.params._id });
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Bundle not found"
            });
        }

        // Update the fields if provided in the request body
        data.bundleName = req.body.bundleName ?? data.bundleName;
        data.bundleTotalPrice = req.body.bundleTotalPrice ?? data.bundleTotalPrice;
        data.bundleDiscountPrice = req.body.bundleDiscountPrice ?? data.bundleDiscountPrice;
        data.bundleDisCountPercenatgae = req.body.bundleDisCountPercenatgae ?? data.bundleDisCountPercenatgae;
        data.bundleCourseId = req.body.bundleCourseId ?? data.bundleCourseId;

        // Handle image update
        if (req.file) {
            const oldImagePublicId = data.bundleImage.public_id;
            if (oldImagePublicId) {
                try {
                    await deleteImageFromCloudinary(oldImagePublicId);
                } catch (error) {
                    console.error("Error deleting old image from Cloudinary:", error);
                }
            }

            // Upload new image to Cloudinary
            const imgUrl = await uploadImage(req.file.path);
            const { image, public_id } = imgUrl;
            data.bundleImage = { url: image, public_id };

            try {
                fs.unlinkSync(req.file.path);
            } catch (error) {
                console.error("Error deleting local image file:", error);
            }
        }

        // Save the updated bundle
        await data.save();

        res.status(200).json({
            success: true,
            message: "Bundle updated successfully",
            data: data
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};


exports.getSingleBundle = async (req, res) => {
    try {
        const id = req.params._id
        console.log(id)
        const singleBundle = await Bundle.findById(id)
        if (!singleBundle) {
            return res.status(404).json({
                success: false,
                message: "Bundle not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Bundle found",
            data: singleBundle
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
}