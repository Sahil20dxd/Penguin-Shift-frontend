import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Share2,
  Lightbulb,
  ChevronDown,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MySharing() {
  const sharedPlaylists = [
    {
      id: 1,
      name: "Playlist_name",
      songs: 1,
      isPublic: true,
      hasSuggestions: true,
    },
    {
      id: 2,
      name: "Playlist_name2",
      songs: 1,
      isPublic: true,
      hasSuggestions: true,
    },
    {
      id: 3,
      name: "Playlist_name3",
      songs: 1,
      isPublic: true,
      hasSuggestions: true,
    },
  ];

  return (
    <div>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 hidden md:block"
      >
        <div className="flex items-center gap-2 mb-4">
          <ChevronDown className="w-5 h-5 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">My Sharing</h2>
        </div>
        <p className="text-gray-600">Manage your publicly shared playlists</p>
      </motion.div>

      <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 p-6">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Public Playlists
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16"></TableHead>
                  <TableHead className="font-semibold">Playlist Name</TableHead>
                  <TableHead className="font-semibold">Songs</TableHead>
                  <TableHead className="text-right font-semibold pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedPlaylists.map((playlist) => (
                  <TableRow key={playlist.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="w-12 h-12 bg-black rounded-lg" />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {playlist.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {playlist.songs} Songs
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-2 pr-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="text-sm">Open</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-purple-50 hover:text-purple-600 flex items-center gap-1"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm">Share</span>
                        </Button>
                        {playlist.hasSuggestions && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-green-50 hover:text-green-600 flex items-center gap-1"
                          >
                            <Lightbulb className="w-4 h-4" />
                            <span className="text-sm">Suggestion</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {sharedPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center p-4 hover:bg-gray-50 gap-3"
              >
                {/* Album Art */}
                <div className="w-12 h-12 bg-black rounded-md flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {`Playlist ${playlist.songs} Songs`}
                  </p>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-500 hover:text-purple-600"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-gray-500 hover:text-blue-600"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                  {playlist.hasSuggestions && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-gray-500 hover:text-green-600"
                    >
                      <Lightbulb className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
