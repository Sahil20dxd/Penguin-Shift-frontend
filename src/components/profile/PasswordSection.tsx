// src/components/profile/PasswordSection.tsx
// --------------------------------------------------------------------
// A reusable component for changing or creating passwords.
// Includes show/hide toggles, optional strength meter, and validation.
// --------------------------------------------------------------------

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/useToast";

// Props accepted by this component
interface PasswordSectionProps {
  /** Called when "Update Password" is clicked */
  onSubmit: (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => void;
  /** Whether to show strength meter (use true on AccountSettings, Register) */
  withStrengthMeter?: boolean;
}

export default function PasswordSection({
  onSubmit,
  withStrengthMeter = false,
}: PasswordSectionProps) {
  const { showToast, Toast } = useToast();

  // Local states for passwords
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Eye toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Strength meter state
  const [passwordStrength, setPasswordStrength] = useState({
    label: "",
    color: "gray",
    score: 0,
  });

  /** Evaluate password strength (length, numbers, upper/lower, symbols) */
  function evaluatePasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = "Weak";
    let color = "red";
    if (score >= 3) {
      label = "Medium";
      color = "yellow";
    }
    if (score === 4) {
      label = "Strong";
      color = "green";
    }

    setPasswordStrength({ label, color, score });
  }

  /** Handle submit click */
  const handleSubmit = () => {
    if (withStrengthMeter && passwordStrength.label === "Weak") {
      showToast("Password too weak", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    onSubmit(oldPassword, newPassword, confirmPassword);
  };

  return (
    <div className="pt-4 border-t border-gray-100">
      <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4" /> Change Password
      </Label>

      {/* Grid layout */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Old Password */}
        <div className="relative">
          <Input
            type={showOld ? "text" : "password"}
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 inset-y-0 flex items-center justify-center text-gray-500 hover:text-gray-700"
            type="button"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {/* New Password */}
        <div className="relative space-y-2">
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (withStrengthMeter) evaluatePasswordStrength(e.target.value);
              }}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 inset-y-0 flex items-center justify-center text-gray-500 hover:text-gray-700"
              type="button"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          {/* Optional strength meter */}
          {withStrengthMeter && newPassword && (
            <div className="mt-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span
                  className={`font-medium ${
                    passwordStrength.color === "red"
                      ? "text-red-500"
                      : passwordStrength.color === "yellow"
                      ? "text-yellow-500"
                      : "text-green-600"
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    passwordStrength.color === "red"
                      ? "bg-red-500"
                      : passwordStrength.color === "yellow"
                      ? "bg-yellow-400"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${passwordStrength.score * 25}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 inset-y-0 flex items-center justify-center text-gray-500 hover:text-gray-700"
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        className="mt-3 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg"
      >
        Update Password
      </Button>

      {Toast}
    </div>
  );
}
