// src/pages/LandingPage/LandingPage.tsx

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music } from "lucide-react";
import { motion } from "framer-motion";

import { platformLogos, features } from "./landing.config";
import {
  heroTitle,
  heroSubtitle,
  sectionTitle,
  sectionSubtitle,
  cardBase,
  featureIconWrapper,
} from "./landing.styles";

/**
 * LandingPage.tsx
 *
 * Public-facing entry point for PenguinShift.
 *
 * Sections included:
 * - Hero section with branding + CTA
 * - Supported Platforms (Spotify, YouTube, etc.)
 * - Features (speed, security, smart matching)
 * - Brand statement for emotional appeal
 * - Final Call To Action (conversion push)
 *
 * Concepts:
 * - Component-based UI for modularity
 * - Framer Motion animations for UX polish
 * - Tailwind styles centralized for readability
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-indigo-500/10" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={heroTitle}>
              Shift your
              <br />
              <span className="text-gray-900">Playlist</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={heroSubtitle}
          >
            Transfer your music playlists between platforms in seconds. Never
            lose your favorite songs when switching music services.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to={'/shift/select'}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-12 py-6 rounded-2xl text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 group"
              >
                SHIFT
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={sectionTitle}>Supported Platforms</h2>
            <p className={sectionSubtitle}>
              Connect your favorite music services and transfer playlists
              seamlessly
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {platformLogos.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className={`${cardBase} p-6 cursor-pointer`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {platform.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {platform.name}
                  </h3>
                  <div
                    className="w-8 h-1 mx-auto mt-2 rounded-full opacity-70"
                    style={{ backgroundColor: platform.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={sectionTitle}>Why Choose PenguinShift?</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`${cardBase} p-8`}
              >
                <div className={featureIconWrapper}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.blockquote
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-light text-white leading-relaxed"
          >
            "Don't let platform switches silence your soundtrack.
            <br />
            <span className="font-semibold">
              Keep your music, change your service.
            </span>
            "
          </motion.blockquote>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className={sectionTitle}>Ready to Shift?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of music lovers who've already made the switch
            </p>
            <Link to={createPageUrl("Dashboard")}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-12 py-6 rounded-2xl text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                Start Shifting Now
                <Music className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
