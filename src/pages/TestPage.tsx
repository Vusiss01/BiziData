import React from "react";
import TestOwnerChanges from "@/components/TestOwnerChanges";

const TestPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a simple test page to verify routing is working.</p>
      <div className="p-4 bg-orange-100 rounded-md mb-6">
        <p>If you can see this, the page is loading correctly!</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Restaurant Owner Tests</h2>
      <TestOwnerChanges />
    </div>
  );
};

export default TestPage;
