import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send } from "lucide-react";

const MessagesPage = () => {
  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Contacts List */}
        <div className="w-80 flex flex-col border rounded-lg bg-white overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search contacts..." className="pl-8" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer ${i === 1 ? "bg-blue-50" : ""}`}
              >
                <Avatar>
                  <AvatarFallback>U{i}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">User Name {i}</p>
                    <span className="text-xs text-gray-500">10:3{i} AM</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {i % 3 === 0 ? "You: " : ""}
                    This is a preview of the last message in the conversation...
                  </p>
                </div>
                {i % 4 === 0 && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col border rounded-lg bg-white overflow-hidden">
          <div className="p-3 border-b flex items-center gap-3">
            <Avatar>
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">User Name 1</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <React.Fragment key={i}>
                <div className="flex items-end gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U1</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <p>
                      This is a message from the other person. How are you doing
                      today?
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      10:30 AM
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-end gap-2">
                  <div className="bg-blue-100 rounded-lg p-3 max-w-[80%]">
                    <p>I'm doing well, thank you! How about you?</p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      10:32 AM
                    </span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input placeholder="Type a message..." className="flex-1" />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
