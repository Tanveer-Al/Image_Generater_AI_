import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AutoAwesome, CreateRounded } from "@mui/icons-material";
import TextInput from "../Input/TextInput";
import Button from "../buttons/button";
import { CreatePost, GenerateImageFromPrompt } from "../../api"; // Make sure these are correctly imported from your API utility file

const Form = styled.div`
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 9%;
  justify-content: center;
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Title = styled.div`
  font-size: 28px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;

const Desc = styled.div`
  font-size: 17px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_secondary};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_secondary};
`;

const Actions = styled.div`
  display: flex;
  flex: 1;
  gap: 8px;
`;

const GenerateImage = ({
  createPostLoading,
  setcreatePostLoading,
  generateImageLoading,
  setGenerateImageLoading,
  post,
  setPost,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const generateImage = async () => {
    setGenerateImageLoading(true);
    setError(""); // Clear previous errors
    await GenerateImageFromPrompt({ prompt: post.prompt })
      .then((res) => {
        // *** यहाँ बदलाव किया गया है ***
        // 'res?.data?.photo' अब सीधे एक URL है, base64 स्ट्रिंग नहीं।
        // इसलिए, 'data:image/jpeg;base64,' प्रीफिक्स को हटा दिया गया है।
        setPost({
          ...post,
          photo: res?.data?.photo, // सीधे URL को सेट करें
        });
        setGenerateImageLoading(false);
      })
      .catch((error) => {
        // Improved error handling to get message from API response
        setError(error?.response?.data?.message || error.message || "Failed to generate image.");
        setGenerateImageLoading(false);
      });
  };

  const createPost = async () => {
    setcreatePostLoading(true);
    setError(""); // Clear previous errors
    await CreatePost(post)
      .then((res) => {
        navigate("/"); // Navigate to home on successful post creation
        setcreatePostLoading(false);
      })
      .catch((error) => {
        // Improved error handling to get message from API response
        setError(error?.response?.data?.message || error.message || "Failed to create post.");
        setcreatePostLoading(false);
      });
  };

  return (
    <Form>
      <Top>
        <Title>Generate Image with prompt</Title>
        <Desc>
          Write your prompt according to the image you want to generate!
        </Desc>
      </Top>
      <Body>
        <TextInput
          label="Author"
          placeholder="Enter your name"
          name="name"
          value={post.name}
          handelChange={(e) => setPost({ ...post, name: e.target.value })}
        />
        <TextInput
          label="Image Prompt"
          placeholder="Write a detailed prompt about the image"
          name="prompt"
          textArea
          rows="8"
          value={post.prompt}
          handelChange={(e) => setPost({ ...post, prompt: e.target.value })}
        />
        {error && <div style={{ color: "red" }}>{error}</div>}
        {/* यह टेक्स्ट बॉडी के अंदर था, इसे बाहर कर दिया गया है ताकि यह एरर मैसेज के साथ मिक्स न हो */}
        <div>You can post the AI Generated Image to showcase in the community!</div>
      </Body>
      <Actions>
        <Button
          text="Generate Image"
          leftIcon={<AutoAwesome />}
          flex
          isLoading={generateImageLoading}
          isDisabled={post.prompt === ""}
          onClick={(e) => generateImage()}
        />
        <Button
          text="Post Image"
          leftIcon={<CreateRounded />}
          type="secondary"
          flex
          isDisabled={
            post.name === "" || post.photo === "" || post.prompt === ""
          }
          isLoading={createPostLoading}
          onClick={() => createPost()}
        />
      </Actions>
    </Form>
  );
};

export default GenerateImage;