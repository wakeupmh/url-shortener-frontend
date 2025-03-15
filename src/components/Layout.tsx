import { Outlet } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Flex, Button, Box, Container } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  return (
    <Container>
      <Box pt="4" pb="6" px="2">
        <Flex justify="between" pt="4" align="center">
          <Flex gap="4" align="center">
            <Button 
              variant="ghost" 
              color="iris"
              onClick={() => navigate("/")}
            >
              Home
            </Button>
            <SignedIn>
              <Button 
                variant="ghost" 
                color="iris"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </Button>
            </SignedIn>
          </Flex>
          
          <Flex>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <UserButton/>
            </SignedIn>
          </Flex>
        </Flex>
      </Box>
      
      <main>
        <Outlet />
      </main>
    </Container>
  );
}
