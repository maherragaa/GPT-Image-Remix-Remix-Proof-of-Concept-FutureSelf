import React, { useEffect, useState } from "react";
import { Bell, BellRing, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification("Notifications Enabled!", {
        body: "You'll now receive timely reminders for logging.",
        icon: "/vite.svg"
      });
    }
  };

  const testMoodNotification = () => {
    if (permission === "granted") {
      new Notification("Evening Check-in 🌙", {
        body: "It's time for your evening mood check-in! Keep your FutureSelf accurate.",
        icon: "/vite.svg" // Example icon
      });
    } else {
      requestPermission();
    }
  };

  const testMealNotification = () => {
    if (permission === "granted") {
      new Notification("Log Your Lunch 🥗", {
        body: "Did you have lunch? Snap a quick log to see how it impacts your biological age.",
        icon: "/vite.svg"
      });
    } else {
      requestPermission();
    }
  };

  // Effect to handle real-time scheduling
  useEffect(() => {
    if (permission !== "granted") return;

    // We check every minute if it is the right time to trigger a notification
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Ensure it only triggers once per minute
      if (hours === 13 && minutes === 0) { // 1 PM (13:00) Lunch reminder
        new Notification("Log Your Lunch 🥗", {
          body: "Did you have lunch? Snap a quick log to see how it impacts your biological age.",
          icon: "/vite.svg"
        });
      }

      if (hours === 20 && minutes === 0) { // 8 PM (20:00) Mood reminder
        new Notification("Evening Check-in 🌙", {
          body: "It's time for your evening mood check-in! Keep your FutureSelf accurate.",
          icon: "/vite.svg"
        });
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, [permission]);

  return (
    <Card id="section-notifications" className="border border-slate-100 rounded-[2.5rem] bg-white overflow-hidden mb-8">
      <CardContent className="p-4 md:p-6 sm:p-8 bg-gradient-to-br from-indigo-50/50 to-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start">
            <div className="bg-indigo-100 p-3 rounded-none md:rounded-lg mr-4 text-indigo-600 shrink-0">
              {permission === "granted" ? <BellRing className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Gentle Logging Reminders</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-2 max-w-lg">
                The simulation is only as good as its data. Enable gentle push notifications for meals and evening check-ins.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testMealNotification}
                  className="rounded-full bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200"
                >
                  Test Lunch Nudge
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={testMoodNotification}
                  className="rounded-full bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200"
                >
                  Test Evening Nudge
                </Button>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {permission !== "granted" ? (
              <Button 
                onClick={requestPermission}
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                Enable Notifications
              </Button>
            ) : (
              <div className="bg-white border border-indigo-100 rounded-xl px-4 py-3 flex items-center text-sm font-semibold text-indigo-700">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Active
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
