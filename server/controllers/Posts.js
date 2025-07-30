import Post from "../models/Posts.js";
import * as dotenv from "dotenv";
import { createError } from "../error.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all posts
export const getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({});
    return res.status(200).json({ success: true, data: posts });
  } catch (error) {
    return next(
      createError(
        error.status,
        error?.response?.data?.error.message || error.message
      )
    );
  }
};

// Create a new post and upload the photo to Cloudinary
export const createPost = async (req, res, next) => {
  try {
    const { name, prompt, photo } = req.body; // Destructure name, prompt, and photo (base64) from request body

    // Validate if essential data is present
    if (!name || !prompt || !photo) {
      return next(createError(400, "Name, prompt, and photo are required."));
    }

    // Upload the base64 photo string to Cloudinary
    // This expects 'photo' to be a base64 encoded string (e.g., "data:image/jpeg;base64,...")
    const photoUrl = await cloudinary.uploader.upload(photo, {
      folder: "your-project-posts", // Optional: specify a folder in Cloudinary
    });

    // Create a new post document in MongoDB
    const newPost = await Post.create({
      name,
      prompt,
      photo: photoUrl.secure_url, // Store the secure URL from Cloudinary
    });

    return res.status(201).json({ success: true, data: newPost }); // Use 201 for resource creation success
  } catch (error) {
    // Log the full error for server-side debugging
    console.error("Error creating post:", error);

    // Pass a more consistent and informative error message to the global error handler
    // Check for specific Cloudinary errors or default to a generic message
    let errorMessage = "Failed to create post.";
    let statusCode = 500;

    if (error.http_code) { // Cloudinary errors often have an http_code
      statusCode = error.http_code;
      errorMessage = error.message;
    } else if (error.response && error.response.data && error.response.data.error) {
      // For errors coming from other APIs if this function ever integrates more
      errorMessage = error.response.data.error.message;
      statusCode = error.response.status || 500;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return next(createError(statusCode, errorMessage));
  }
};