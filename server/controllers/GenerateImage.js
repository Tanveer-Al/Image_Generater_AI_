import * as dotenv from "dotenv";
import { createError } from "../error.js";
import axios from "axios"; // Import axios for making HTTP requests

dotenv.config();

// Stable Diffusion API Key and URL (अब modelslab.com का उपयोग कर रहे हैं)
// सुनिश्चित करें कि आपने .env फाइल में STABLE_DIFFUSION_API_KEY को सेट किया है
const STABLE_DIFFUSION_API_KEY = process.env.STABLE_DIFFUSION_API_KEY;
const STABLE_DIFFUSION_API_URL = "https://modelslab.com/api/v6/realtime/text2img"; // नया API एंडपॉइंट

// Controller to generate Image
export const generateImage = async (req, res, next) => {
  try {
    // Extract the prompt from the request body
    const { prompt } = req.body;

    // Basic validation to ensure prompt is provided
    if (!prompt) {
      return next(createError(400, "Image prompt is required."));
    }

    // Ensure the API Key is configured
    if (!STABLE_DIFFUSION_API_KEY) {
      return next(createError(500, "Stable Diffusion API Key is not configured."));
    }

    // Payload for the ModelsLab API request
    const payload = {
      key: STABLE_DIFFUSION_API_KEY, // आपकी API Key
      prompt: prompt,
      negative_prompt: "bad quality, ugly, deformed, disfigured, blurry, low resolution, bad hands, missing fingers", // बेहतर गुणवत्ता के लिए नकारात्मक प्रॉम्प्ट
      width: "512", // इमेज की चौड़ाई
      height: "512", // इमेज की ऊंचाई
      safety_checker: false, // modelslab.com उदाहरण के अनुसार
      seed: null, // यादृच्छिक बीज; null का अर्थ है API इसे स्वयं चुनेगा
      samples: 1, // कितनी इमेज जनरेट करनी है
      base64: false, // modelslab.com उदाहरण के अनुसार: यह API आपको इमेज का URL देगा, base64 स्ट्रिंग नहीं
      webhook: null,
      track_id: null,
      // num_inference_steps को हटा दिया गया है क्योंकि यह modelslab.com के उदाहरण में नहीं था।
      // guidance_scale को हटा दिया गया है क्योंकि यह modelslab.com के उदाहरण में नहीं था।
    };

    // Make the API call using axios
    const response = await axios.post(STABLE_DIFFUSION_API_URL, payload);

    // Handle the response from the ModelsLab API
    // modelslab.com का response structure OpenAI या stablediffusionapi.com से अलग है
    if (response.data && response.data.output && response.data.output.length > 0) {
      // modelslab.com API base64: false होने पर इमेज का URL देता है
      const generatedImageUrl = response.data.output[0]; // यह सीधे इमेज का URL होगा
      res.status(200).json({ photo: generatedImageUrl }); // 'photo' के रूप में URL भेजें
    } else {
      // If there's an error or unexpected data in the API response
      console.error("ModelsLab API Response Error:", response.data);
      const apiErrorMessage = response.data.message || "Unknown error from ModelsLab API.";
      return next(createError(response.status || 500, `Failed to generate image: ${apiErrorMessage}`));
    }

  } catch (error) {
    // Enhanced error logging for debugging purposes
    console.error("ModelsLab API Error:", error.message);
    if (error.response) {
      console.error("ModelsLab Status:", error.response.status);
      console.error("ModelsLab Data:", error.response.data);
    }

    // Pass specific error messages to the client using createError
    let errorMessage = "Image generation failed using ModelsLab.";
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    next(createError(error.response?.status || 500, errorMessage));
  }
};