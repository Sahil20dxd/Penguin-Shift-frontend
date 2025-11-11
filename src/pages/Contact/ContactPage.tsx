// src/pages/Contact.tsx
import React from "react";

export default function ContactPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Contact Us</h1>
      <p className="text-gray-600">
        For any inquiries or feedback, please email us at{" "}
        <span className="font-semibold">support@penguinshift.com</span>.
      </p>
    </div>
  );
}
