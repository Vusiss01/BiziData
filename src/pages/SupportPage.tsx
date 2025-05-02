import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  FileQuestion, 
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  created_at: any;
  updated_at: any;
  user_id: string;
  user_email: string;
}

const SupportPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch FAQs from Firebase
  const { data: faqs = [], isLoading: faqsLoading, error: faqsError } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      try {
        console.log("Fetching FAQs from Firebase");
        
        // Create query
        const faqsQuery = query(
          collection(db, "faqs"),
          orderBy("category"),
          limit(10)
        );
        
        // Execute query
        const snapshot = await getDocs(faqsQuery);
        
        console.log(`Query returned ${snapshot.docs.length} FAQs`);
        
        // Process results
        const faqsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            question: data.question,
            answer: data.answer,
            category: data.category
          };
        });
        
        return faqsData;
      } catch (err) {
        console.error("Error fetching FAQs:", err);
        throw err;
      }
    },
  });

  // Fetch user's support tickets
  const { 
    data: tickets = [], 
    isLoading: ticketsLoading, 
    error: ticketsError,
    refetch: refetchTickets
  } = useQuery({
    queryKey: ["supportTickets", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        console.log("Fetching support tickets from Firebase");
        
        // Create query
        const ticketsQuery = query(
          collection(db, "support_tickets"),
          orderBy("created_at", "desc")
        );
        
        // Execute query
        const snapshot = await getDocs(ticketsQuery);
        
        console.log(`Query returned ${snapshot.docs.length} tickets`);
        
        // Process results
        const ticketsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            subject: data.subject,
            message: data.message,
            status: data.status,
            created_at: data.created_at?.toDate?.() || data.created_at,
            updated_at: data.updated_at?.toDate?.() || data.updated_at,
            user_id: data.user_id,
            user_email: data.user_email
          };
        });
        
        // Filter to only show this user's tickets
        return ticketsData.filter(ticket => ticket.user_id === user.uid);
      } catch (err) {
        console.error("Error fetching support tickets:", err);
        throw err;
      }
    },
    enabled: !!user, // Only run query if user is authenticated
  });

  // Submit support ticket
  const submitSupportTicket = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a support ticket",
        variant: "destructive"
      });
      return;
    }
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add new support ticket to Firestore
      await addDoc(collection(db, "support_tickets"), {
        subject,
        message,
        status: "open",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        user_id: user.uid,
        user_email: user.email
      });
      
      // Clear form
      setSubject("");
      setMessage("");
      
      // Show success message
      toast({
        title: "Success",
        description: "Your support ticket has been submitted",
        variant: "default"
      });
      
      // Refetch tickets
      refetchTickets();
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Options */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-3 text-orange-500" />
                <span>Live Chat (9am - 5pm EST)</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-orange-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-orange-500" />
                <span>support@foodbase.com</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Helpful resources and documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/documentation">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://firebase.google.com/docs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Firebase Docs
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Submit Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Our support team will respond as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue in detail"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                  onClick={submitSupportTicket}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Your Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Your Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
                  <p>Loading your tickets...</p>
                </div>
              ) : ticketsError ? (
                <div className="flex items-center justify-center p-4 text-red-500">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <p>Error loading tickets</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <p>You haven't submitted any support tickets yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ticket.message}</p>
                      <p className="text-xs text-gray-500">
                        Submitted on:{" "}
                        {ticket.created_at instanceof Date
                          ? ticket.created_at.toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {faqsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
                  <p>Loading FAQs...</p>
                </div>
              ) : faqsError ? (
                <div className="flex items-center justify-center p-4 text-red-500">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <p>Error loading FAQs</p>
                </div>
              ) : faqs.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <p>No FAQs available at this time</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                    <div key={category}>
                      <h3 className="font-medium text-lg mb-3">{category}</h3>
                      <div className="space-y-4">
                        {categoryFaqs.map((faq) => (
                          <div key={faq.id} className="border rounded-md p-4">
                            <h4 className="font-medium mb-2">{faq.question}</h4>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
