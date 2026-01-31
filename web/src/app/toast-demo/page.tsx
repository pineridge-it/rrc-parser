"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useNotifications } from "@/components/notifications"
import { BannerNotification } from "@/components/notifications"
import { toast } from "sonner"
import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Mail,
  MessageSquare,
  Smartphone,
  X,
} from "lucide-react"

const codeExample = `import { useToast } from "@/components/ui/use-toast";

function MyComponent() {
  const { success, error, promise } = useToast();

  // Simple toast
  const handleSave = () => {
    success("Saved!", { description: "Your changes were saved." });
  };

  // Toast with action
  const handleDelete = () => {
    success("Deleted", {
      description: "Item moved to trash.",
      action: {
        label: "Undo",
        onClick: () => undoDelete(),
      },
    });
  };

  // Promise toast
  const handleSubmit = async () => {
    await promise(saveData(), {
      loading: "Saving...",
      success: "Saved!",
      error: "Failed to save",
    });
  };

  return &lt;button onClick={handleSave}&gt;Save&lt;/button&gt;;
}`;

/**
 * Notification Demo Page
 *
 * Demonstrates all notification system variants including toast, banner, and in-app notifications.
 */
export default function ToastDemoPage() {
  const { addNotification, notifications, markAsRead, markAllAsRead, removeNotification } =
    useNotifications()
  const [bannerNotifications, setBannerNotifications] = useState<BannerNotification[]>([])

  const addSampleNotification = (type: "info" | "success" | "warning" | "error") => {
    const titles = {
      info: "System Update",
      success: "Operation Completed",
      warning: "Storage Low",
      error: "Connection Error",
    }

    const bodies = {
      info: "We've released new features. Check them out!",
      success: "Your data export has been completed successfully.",
      warning: "You're approaching your storage limit.",
      error: "Failed to connect to the server. Please try again.",
    }

    const categories = ["system", "permit", "alert", "export", "usage"]
    const icons = ["system", "permit", "alert", "export", "usage"]
    const priorities = ["low", "medium", "high", "critical"]

    addNotification({
      title: titles[type],
      body: bodies[type],
      type,
      category: categories[Math.floor(Math.random() * categories.length)] as any,
      icon: icons[Math.floor(Math.random() * icons.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
    })
  }

  const addBannerNotification = (type: "info" | "success" | "warning" | "error") => {
    const titles = {
      info: "Maintenance Scheduled",
      success: "Upgrade Successful",
      warning: "Performance Issue",
      error: "Service Disruption",
    }

    const messages = {
      info: "Scheduled maintenance will occur this weekend.",
      success: "Your account has been upgraded successfully.",
      warning: "We're experiencing intermittent performance issues.",
      error: "Our service is currently unavailable. We're working to restore it.",
    }

    const newNotification: BannerNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: titles[type],
      message: messages[type],
      dismissible: true,
      duration: type === "error" ? 0 : 5000,
      action:
        type === "info"
          ? {
              label: "Learn More",
              onClick: () => toast.info("Learn more clicked"),
            }
          : undefined,
    }

    setBannerNotifications((prev) => [newNotification, ...prev])
  }

  const dismissBannerNotification = (id: string) => {
    setBannerNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const addToastNotification = (type: "info" | "success" | "warning" | "error") => {
    const messages = {
      info: "This is an informational toast message",
      success: "This is a success toast message",
      warning: "This is a warning toast message",
      error: "This is an error toast message",
    }

    const options = {
      description: "This is a description for the toast notification",
      action: {
        label: "Undo",
        onClick: () => toast.info("Undo action clicked"),
      },
    }

    switch (type) {
      case "success":
        toast.success(messages[type], options)
        break
      case "warning":
        toast.warning(messages[type], options)
        break
      case "error":
        toast.error(messages[type], options)
        break
      default:
        toast.info(messages[type], options)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification System Demo</h1>
        <p className="text-gray-600 mt-2">
          Showcase of the enhanced notification system with toast, banner, and in-app notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Toast Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Toast Notifications
            </CardTitle>
            <CardDescription>
              Non-intrusive notifications that appear briefly and disappear automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => addToastNotification("info")} variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Info Toast
              </Button>
              <Button
                onClick={() => addToastNotification("success")}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Success Toast
              </Button>
              <Button
                onClick={() => addToastNotification("warning")}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warning Toast
              </Button>
              <Button
                onClick={() => addToastNotification("error")}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Error Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Banner Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Banner Notifications
            </CardTitle>
            <CardDescription>
              Prominent notifications that appear at the top of the screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => addBannerNotification("info")} variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Info Banner
              </Button>
              <Button
                onClick={() => addBannerNotification("success")}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Success Banner
              </Button>
              <Button
                onClick={() => addBannerNotification("warning")}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warning Banner
              </Button>
              <Button
                onClick={() => addBannerNotification("error")}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Error Banner
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Persistent notifications stored in the notification center
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => addSampleNotification("info")} variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Info
              </Button>
              <Button
                onClick={() => addSampleNotification("success")}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Success
              </Button>
              <Button
                onClick={() => addSampleNotification("warning")}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warning
              </Button>
              <Button
                onClick={() => addSampleNotification("error")}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Error
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Notifications</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => markAllAsRead()} variant="outline">
                  Mark All as Read
                </Button>
                <Button
                  onClick={() => {
                    setBannerNotifications([]);
                    toast.info("All banner notifications dismissed");
                  }}
                  variant="outline"
                >
                  Dismiss All Banners
                </Button>
                <Button
                  onClick={() => {
                    notifications.forEach((n) => removeNotification(n.id));
                    toast.info("All notifications cleared");
                  }}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  Clear All Notifications
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Example Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Implementation Example
          </CardTitle>
          <CardDescription>
            How to use the notification system in your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>{codeExample}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Banner Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
        {bannerNotifications.map((notification) => (
          <div key={notification.id} className="flex items-start bg-white border rounded-lg p-4 shadow-lg">
            <div className="flex-shrink-0">
              {notification.type === "success" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {notification.type === "warning" && (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              {notification.type === "error" && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {notification.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="ml-3 flex-1">
              <h3
                className={`text-sm font-medium ${
                  notification.type === "success"
                    ? "text-green-800"
                    : notification.type === "warning"
                      ? "text-yellow-800"
                      : notification.type === "error"
                        ? "text-red-800"
                        : "text-blue-800"
                }`}
              >
                {notification.title}
              </h3>
              <div
                className={`mt-1 text-sm ${
                  notification.type === "success"
                    ? "text-green-700"
                    : notification.type === "warning"
                      ? "text-yellow-700"
                      : notification.type === "error"
                        ? "text-red-700"
                        : "text-blue-700"
                }`}
              >
                <p>{notification.message}</p>
              </div>
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className={`text-sm font-medium ${
                      notification.type === "success"
                        ? "text-green-800 hover:text-green-900"
                        : notification.type === "warning"
                          ? "text-yellow-800 hover:text-yellow-900"
                          : notification.type === "error"
                            ? "text-red-800 hover:text-red-900"
                            : "text-blue-800 hover:text-blue-900"
                    }`}
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            {notification.dismissible !== false && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => dismissBannerNotification(notification.id)}
                  className={`${
                    notification.type === "success"
                      ? "text-green-500 hover:text-green-700"
                      : notification.type === "warning"
                        ? "text-yellow-500 hover:text-yellow-700"
                        : notification.type === "error"
                          ? "text-red-500 hover:text-red-700"
                          : "text-blue-500 hover:text-blue-700"
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
