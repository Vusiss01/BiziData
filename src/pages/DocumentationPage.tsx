import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DocumentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  created_at: any;
  updated_at: any;
  url?: string;
}

const DocumentationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch documentation from Firebase
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documentation", activeCategory],
    queryFn: async () => {
      try {
        console.log("Fetching documentation from Firebase");
        
        // Create base query
        let docsQuery = query(
          collection(db, "documentation"),
          orderBy("created_at", "desc")
        );
        
        // Add category filter if not "all"
        if (activeCategory !== "all") {
          docsQuery = query(
            collection(db, "documentation"),
            where("category", "==", activeCategory),
            orderBy("created_at", "desc")
          );
        }
        
        // Execute query
        const snapshot = await getDocs(docsQuery);
        
        console.log(`Query returned ${snapshot.docs.length} documentation items`);
        
        // Process results
        const docsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            content: data.content,
            category: data.category,
            tags: data.tags || [],
            created_at: data.created_at?.toDate?.() || data.created_at,
            updated_at: data.updated_at?.toDate?.() || data.updated_at,
            url: data.url
          };
        });
        
        return docsData;
      } catch (err) {
        console.error("Error fetching documentation:", err);
        throw err;
      }
    },
  });

  // Filter documents based on search query
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group documents by category for the sidebar
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocumentItem[]>);

  // Get unique categories
  const categories = Object.keys(documentsByCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documentation</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search documentation..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
          <p>Loading documentation...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-12 text-red-500">
          <AlertCircle className="h-8 w-8 mr-2" />
          <div>
            <p className="font-semibold">Error loading documentation</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center p-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">No documentation available</p>
          <p className="text-sm mt-1">
            Documentation will appear here once added to the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-1">
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeCategory === "all"
                      ? "bg-orange-100 text-orange-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveCategory("all")}
                >
                  All Documentation
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeCategory === category
                        ? "bg-orange-100 text-orange-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Documentation Content */}
          <div className="lg:col-span-3 space-y-6">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="text-center p-8 text-gray-500">
                  <p className="font-semibold">No documentation found</p>
                  <p className="text-sm mt-1">
                    Try adjusting your search query or category filter.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{doc.title}</CardTitle>
                      {doc.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 mb-4">{doc.description}</p>
                    <div className="prose max-w-none">
                      {/* In a real app, you might want to render markdown content */}
                      <p>{doc.content}</p>
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-4">
                      Last updated:{" "}
                      {doc.updated_at instanceof Date
                        ? doc.updated_at.toLocaleDateString()
                        : "Unknown"}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationPage;
