import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export default function ProfileQuote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-center py-12"
    >
      <blockquote className="max-w-3xl mx-auto">
        <p className="text-lg md:text-xl text-gray-600 italic leading-relaxed mb-6">
          "Your music, your way—seamlessly transferred across platforms with{" "}
          <span className="font-semibold text-gray-900">SongShift</span>."
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-black rounded-full shadow-lg" />
          <div>
            <p className="font-semibold text-gray-900">Sahil Hepara</p>
            <p className="text-sm text-gray-500">Product Designer</p>
          </div>
        </div>
      </blockquote>
    </motion.div>
  );
}
