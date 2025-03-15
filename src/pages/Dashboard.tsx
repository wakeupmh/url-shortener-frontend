/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Container,
  Heading,
  Table,
  Text,
  TextField,
  Button,
  Flex,
  Card,
  IconButton,
  Select,
  Separator,
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
import { useAuth } from "@clerk/clerk-react";

interface UrlData {
  id: string;
  originalUrl: string;
  shortUrl: string;
  slug: string;
  createdAt: string;
  clicks: number;
  isEditing: boolean;
}

export default function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL
  const [urlData, setUrlData] = useState<UrlData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [editValues, setEditValues] = useState<Record<string, { originalUrl: string; slug: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      const headers: {
        Authorization?: string
        'Content-Type': string
      } = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/urls`, {
        method: "GET",
        headers,
      });

      const result = await response.json();
      
      if (result.errors) {
        const errorMsg = result.errors.map((error: { detail: string }) => error.detail).join(", ");
        setError(errorMsg);
        showToast("Error", errorMsg, "error");
        setIsLoading(false);
        return;
      }

      const transformedData = result.data.map((item: any) => ({
        id: item.id,
        originalUrl: item.attributes['original-url'],
        shortUrl: item.attributes['short-url'],
        slug: item.attributes.slug,
        createdAt: new Date(item.attributes['created-at']).toLocaleDateString(),
        clicks: item.attributes['visit-count'] || 0,
        isEditing: false
      }));

      setUrlData(transformedData);
      
      const initialEditValues = transformedData.reduce((acc: any, item: UrlData) => ({
        ...acc,
        [item.id]: { originalUrl: item.originalUrl, slug: item.slug }
      }), {});
      
      setEditValues(initialEditValues);
      setIsLoading(false);
      
      if (transformedData.length > 0) {
        showToast("URLs Loaded", `${transformedData.length} URLs loaded successfully`, "info");
      }
    } catch (error) {
      console.error("Error fetching URLs:", error);
      const errorMsg = "Failed to load URLs. Please try again.";
      setError(errorMsg);
      showToast("Error", errorMsg, "error");
      setIsLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = urlData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(urlData.length / itemsPerPage);

  const toggleEditMode = (id: string) => {
    setUrlData(prevData => 
      prevData.map(item => {
        if (item.id === id) {
          if (!item.isEditing) {
            setEditValues({
              ...editValues,
              [id]: { originalUrl: item.originalUrl, slug: item.slug }
            });
          }
          return { ...item, isEditing: !item.isEditing };
        }
        return item;
      })
    );
  };

  const handleEditChange = (id: string, field: 'originalUrl' | 'slug', value: string) => {
    setEditValues({
      ...editValues,
      [id]: {
        ...editValues[id],
        [field]: value
      }
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const token = await getToken();
      
      const headers: {
        Authorization?: string
        'Content-Type': string
      } = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/urls/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          data: {
            attributes: {
              "original-url": editValues[id]?.originalUrl,
              "slug": editValues[id]?.slug
            }
          }
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        const errorMsg = result.errors.map((error: { detail: string }) => error.detail).join(", ");
        setError(errorMsg);
        showToast("Error", errorMsg, "error");
        return;
      }

      const updatedResponse = await fetch(`${API_URL}/api/urls/${id}`, {
        method: "GET",
        headers,
      });

      const updatedResult = await updatedResponse.json();
      
      if (updatedResult.errors) {
        const errorMsg = updatedResult.errors.map((error: { detail: string }) => error.detail).join(", ");
        setError(errorMsg);
        showToast("Error", errorMsg, "error");
        return;
      }

      const updatedItem = {
        id: updatedResult.data.id,
        originalUrl: updatedResult.data.attributes['original-url'],
        shortUrl: updatedResult.data.attributes['short-url'],
        slug: updatedResult.data.attributes.slug,
        createdAt: new Date(updatedResult.data.attributes['created-at']).toLocaleDateString(),
        clicks: updatedResult.data.attributes['visit-count'] || 0,
        isEditing: false
      };

      setUrlData(prevData => 
        prevData.map(item => {
          if (item.id === id) {
            return updatedItem;
          }
          return item;
        })
      );

      setEditValues(prev => ({
        ...prev,
        [id]: { 
          originalUrl: updatedItem.originalUrl, 
          slug: updatedItem.slug 
        }
      }));
      
      showToast("Success", "URL updated successfully", "success");
    } catch (error) {
      console.error("Error updating URL:", error);
      const errorMsg = "Failed to update URL. Please try again.";
      setError(errorMsg);
      showToast("Error", errorMsg, "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      
      const headers: {
        Authorization?: string
      } = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/urls/${id}`, {
        method: "DELETE",
        headers,
      });

      if (response.status === 204) {
        await fetchUrls();
        showToast("Success", "URL deleted successfully", "success");
      } else {
        const result = await response.json();
        if (result.errors) {
          const errorMsg = result.errors.map((error: { detail: string }) => error.detail).join(", ");
          setError(errorMsg);
          showToast("Error", errorMsg, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      const errorMsg = "Failed to delete URL. Please try again.";
      setError(errorMsg);
      showToast("Error", errorMsg, "error");
    }
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Container size="3" style={{ paddingTop: 0 }}>
        <Card size="3">
          <Flex direction="column" gap="5" align="center" justify="center" style={{ minHeight: "300px" }}>
            <Spinner size="3"/>
          </Flex>
        </Card>
      </Container>
    );
  }
  return (
    <ToastProvider swipeDirection="right">
      <Container size="3" style={{ paddingTop: 0 }}>
        <Card size="3">
          <Flex direction="column" gap="5">
            <Heading size="6">Your Shortened URLs</Heading>
            <Text size="2" color="gray">
              Manage all your shortened URLs. You can edit, delete, and see click statistics.
            </Text>

            {error && (
              <Text color="crimson" size="2" style={{ marginBottom: "10px" }}>
                {error}
              </Text>
            )}

            {urlData.length === 0 && !isLoading ? (
              <Flex direction="column" gap="3" align="center" justify="center" style={{ padding: "40px 0" }}>
                <Text size="3">You don't have any shortened URLs yet.</Text>
                <Button 
                  size="2" 
                  color="iris" 
                  onClick={() => window.location.href = '/'}
                >
                  Create Your First Short URL
                </Button>
              </Flex>
            ) : (
              <>
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Original URL</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Short URL</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Slug</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Clicks</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {currentItems.map((item) => (
                      <Table.Row key={item.id}>
                        <Table.Cell>
                          {item.isEditing ? (
                            <TextField.Root
                              size="2"
                              value={editValues[item.id]?.originalUrl || ""}
                              onChange={(e) => handleEditChange(item.id, 'originalUrl', e.target.value)}
                            />
                          ) : (
                            <Text size="2" style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.originalUrl}
                            </Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{item.shortUrl}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          {item.isEditing ? (
                            <TextField.Root
                              size="2"
                              value={editValues[item.id]?.slug || ""}
                              onChange={(e) => handleEditChange(item.id, 'slug', e.target.value)}
                            />
                          ) : (
                            <Text size="2" color="iris">
                              {item.slug}
                            </Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{item.createdAt}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{item.clicks}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            {item.isEditing ? (
                              <IconButton 
                                size="1" 
                                variant="soft" 
                                color="green" 
                                onClick={() => saveEdit(item.id)}
                              >
                                ✓
                              </IconButton>
                            ) : (
                              <IconButton 
                                size="1" 
                                variant="soft" 
                                color="iris"
                                onClick={() => toggleEditMode(item.id)}
                              >
                                ✎
                              </IconButton>
                            )}
                            <IconButton 
                              size="1" 
                              variant="soft" 
                              color="crimson" 
                              onClick={() => handleDelete(item.id)}
                            >
                              ✕
                            </IconButton>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>

                <Separator size="4" />

                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Text size="2">Items per page:</Text>
                    <Select.Root 
                      value={String(itemsPerPage)} 
                      onValueChange={handleItemsPerPageChange}
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="3">3</Select.Item>
                        <Select.Item value="5">5</Select.Item>
                        <Select.Item value="10">10</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>

                  {urlData.length > itemsPerPage && (
                    <Flex gap="2">
                      <Button 
                        size="2" 
                        variant="soft" 
                        color="iris"
                        disabled={currentPage === 1}
                        onClick={() => changePage(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      
                      <Flex align="center" gap="2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button 
                            key={page}
                            size="2" 
                            color="iris"
                            variant={currentPage === page ? "solid" : "soft"}
                            onClick={() => changePage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </Flex>
                      
                      <Button 
                        size="2" 
                        variant="soft" 
                        color="iris"
                        disabled={currentPage === totalPages}
                        onClick={() => changePage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </>
            )}
          </Flex>
        </Card>
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
