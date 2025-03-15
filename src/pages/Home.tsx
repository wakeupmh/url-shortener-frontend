import { useState } from "react";
import { 
  Card, 
  Container, 
  Flex, 
  Heading, 
  Text, 
  TextField, 
  Button, 
  Grid, 
  IconButton,
  Spinner
} from "@radix-ui/themes";
import { 
  Toast, 
  ToastProvider, 
  ToastViewport, 
  ToastTitle, 
  ToastDescription, 
  ToastClose 
} from "@radix-ui/react-toast";
import { ClipboardIcon } from "../components/ClipboardIcon";
import { useAuth } from "@clerk/clerk-react";

export default function Home() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { getToken } = useAuth();
  
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastDescription, setToastDescription] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (title: string, description: string, type: "success" | "error" | "info" = "success") => {
    setToastTitle(title);
    setToastDescription(description);
    setToastType(type);
    setToastOpen(true);
  };

  const handleShorten = async () => {
    if (originalUrl) {
      const headers: {
        Authorization?: string
        'Content-Type': string
      } = {
        "Content-Type": "application/json",
      }
      
      const token = await getToken();

      if(token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/urls`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            data: {
              attributes: {
                originalUrl
              }
            }
          }),
        });
        const data = await response.json();
        if(data.errors) {
          setError(data.errors.map((error: { detail: string }) => error.detail).join(", "));
          showToast("Error", data.errors.map((error: { detail: string }) => error.detail).join(", "), "error");
          setIsLoading(false);
          return;
        }
        setShortUrl(data.data.attributes['short-url']);
        setIsSuccess(true);
        showToast("Success", "URL has been shortened successfully!", "success");
        setIsLoading(false);
      } catch (error) {
        console.error("Error shortening URL:", error);
        setError("Failed to shorten URL. Please try again.");
        showToast("Error", "Failed to shorten URL. Please try again.", "error");
        setIsLoading(false);
      }
    }
  };

  const handleCopy = () => {
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl);
      showToast("Copied!", "URL copied to clipboard", "info");
    }
  };

  const reset = () => {
    setOriginalUrl("");
    setShortUrl("");
    setIsSuccess(false);
    setError("");
  };

  return (
    <ToastProvider swipeDirection="right">
      <Container size="2" style={{ paddingTop: 0 }}>
        <Grid columns="1" gap="6">
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading as="h2" size="5">
                URL Shortener 🔗
              </Heading>
              
              <Text size="2">Enter the URL to shorten</Text>
              
              <TextField.Root 
                placeholder="URL" 
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                readOnly={isSuccess}
                size="3"
              />
              
              <Flex gap="3" align="center">
                <Button 
                  size="3"
                  variant="outline"
                  color="crimson"
                  onClick={reset}
                >
                  Reset
                </Button>
                <Button 
                  size="3"
                  variant="solid"
                  color="iris"
                  disabled={isLoading}
                  onClick={handleShorten}
                >
                  {isLoading ? <Flex gap="2" align="center"><Spinner size="1" /> Shortening...</Flex> : "Shorten"}
                </Button>
              </Flex>
              
              {isSuccess && (
                <>
                  <Text color="jade" size="2" weight="medium">
                    Success! Here's your short URL:
                  </Text>
                  
                  <Flex gap="2" align="center">
                    <Text 
                      size="2" 
                      color="iris" 
                      style={{ textDecoration: "underline" }}
                    >
                      {shortUrl}
                    </Text>
                    
                    <IconButton 
                      size="1" 
                      variant="soft" 
                      color="gray" 
                      onClick={handleCopy}
                    >
                      <ClipboardIcon />
                    </IconButton>
                  </Flex>
                </>
              )}

              {error && (
                <Text color="crimson" size="2">
                  😨 {error}
                </Text>
              )}
            </Flex>
          </Card>
        </Grid>
      </Container>

      <Toast 
        open={toastOpen} 
        onOpenChange={setToastOpen}
        duration={3000}
        className={`toast ${toastType}`}
      >
        <ToastTitle className="toast-title">{toastTitle}</ToastTitle>
        <ToastDescription className="toast-description">{toastDescription}</ToastDescription>
        <ToastClose aria-label="Close" className="toast-close">✕</ToastClose>
      </Toast>
      
      <ToastViewport className="toast-viewport" />
    </ToastProvider>
  );
}
