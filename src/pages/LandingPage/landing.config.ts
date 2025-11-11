// src/pages/LandingPage/landing.config.ts

import { Zap, Shield, Download } from "lucide-react";

/** Supported music platforms */
export const platformLogos = [
  { name: "Spotify", color: "#1DB954", icon: "🎵" },
  { name: "YouTube Music", color: "#FF0000", icon: "🎬" },
  { name: "Amazon Music", color: "#FF9900", icon: "🎶" },
  { name: "JioSaavn", color: "#FF6B35", icon: "🎤" },
  { name: "Apple Music", color: "#FA57C1", icon: "🍎" },
  { name: "Pandora", color: "#005483", icon: "📻" },
];

/** Feature highlights */
export const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Transfer your entire playlist in seconds, not hours",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "OAuth 2.0 authentication ensures your data stays safe",
  },
  {
    icon: Download,
    title: "Smart Matching",
    description: "AI-powered song matching with CSV export for unmatched tracks",
  },
];
