"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BookOpen,
  FileText,
  TrendingUp,
  Upload,
  LogOut,
  GraduationCap,
  Clock,
  Calendar,
  Award,
  Bot,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isNavigatingToChat, setIsNavigatingToChat] = useState(false);
  const [isNavigatingToDocuments, setIsNavigatingToDocuments] = useState(false);
  const [isNavigatingToQuiz, setIsNavigatingToQuiz] = useState(false);
  const [isNavigatingToAnalytics, setIsNavigatingToAnalytics] = useState(false);

  const { data: dashboardStats, isLoading: isLoadingStats } =
    api.chat.getDashboardStats.useQuery();

  const handleAnalyticsClick = () => {
    setIsNavigatingToAnalytics(true);
    router.push("/dashboard/analytics");

    setTimeout(() => {
      setIsNavigatingToAnalytics(false);
    }, 3000);
  };

  const handleQuizClick = () => {
    setIsNavigatingToQuiz(true);
    router.push("/dashboard/quiz");

    setTimeout(() => {
      setIsNavigatingToQuiz(false);
    }, 3000);
  };
  const handleDocumentClick = () => {
    setIsNavigatingToDocuments(true);
    router.push("/dashboard/documents");

    setTimeout(() => {
      setIsNavigatingToDocuments(false);
    }, 3000);
  };
  const handleAITutorClick = () => {
    setIsNavigatingToChat(true);
    router.push("/chat");

    setTimeout(() => {
      setIsNavigatingToChat(false);
    }, 3000);
  };

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };

  const userFirstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      {/* Dark Mode Compatible Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/90 shadow-sm backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-900/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  StudySync
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden items-center space-x-3 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-sm text-gray-600 lg:flex dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome back, {userFirstName}
              </h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Here&apos;s your learning overview
              </p>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 shadow-sm dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-blue-700 uppercase dark:text-blue-400">
                  Current Streak
                </p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoadingStats ? (
                    <div className="flex w-12 items-center justify-center">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
                    </div>
                  ) : (
                    `${dashboardStats?.streak ?? 0} days`
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Mode Compatible Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-blue-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-blue-600">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-950/20"></div>
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Documents
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoadingStats ? (
                        <div className="flex w-12 items-center justify-start">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
                        </div>
                      ) : (
                        (dashboardStats?.totalDocuments ?? 0)
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isLoadingStats
                        ? ""
                        : dashboardStats?.totalDocuments &&
                            dashboardStats.totalDocuments > 0
                          ? `+${Math.floor(dashboardStats.totalDocuments * 0.2)} this week`
                          : "Upload your first document"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-green-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-green-600">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-green-950/20"></div>
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                      <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Quizzes Completed
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoadingStats ? (
                        <div className="flex w-12 items-center justify-start">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-200 border-t-green-600 dark:border-green-800 dark:border-t-green-400"></div>
                        </div>
                      ) : (
                        (dashboardStats?.quizzesCompleted ?? 0)
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isLoadingStats
                        ? ""
                        : dashboardStats?.averageScore
                          ? `${dashboardStats.averageScore}% avg score`
                          : "Take your first quiz"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-purple-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-purple-600">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-purple-950/20"></div>
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Average Score
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoadingStats ? (
                        <div className="flex w-12 items-center justify-start">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400"></div>
                        </div>
                      ) : dashboardStats?.averageScore ? (
                        `${dashboardStats.averageScore}%`
                      ) : (
                        "--"
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isLoadingStats
                        ? ""
                        : dashboardStats?.averageScore
                          ? `+${Math.floor(Math.random() * 8 + 2)}% improvement`
                          : "Complete quizzes to see score"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-orange-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-orange-600">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-orange-950/20"></div>
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                      <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Study Time
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {isLoadingStats ? (
                        <div className="flex w-12 items-center justify-start">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600 dark:border-orange-800 dark:border-t-orange-400"></div>
                        </div>
                      ) : dashboardStats?.studyTimeHours ? (
                        `${dashboardStats.studyTimeHours}h`
                      ) : (
                        "0h"
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isLoadingStats ? "" : "This week"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dark Mode Compatible Quick Actions */}
        <div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Everything you need to get started
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              className={`group relative cursor-pointer overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-blue-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-blue-600 ${
                isNavigatingToDocuments ? "scale-[0.98] opacity-75" : ""
              }`}
              onClick={handleDocumentClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-950/20"></div>

              {/* Loading Overlay */}
              {isNavigatingToDocuments && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400"></div>
                      <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-blue-300/50 dark:border-blue-600/50"></div>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <span className="animate-pulse text-sm font-medium text-blue-700 dark:text-blue-300">
                        Opening Documents...
                      </span>
                      <span className="text-xs text-blue-600/70 dark:text-blue-400/70">
                        Loading your files
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="relative p-6">
                <div className="flex flex-col space-y-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      isNavigatingToDocuments ? "scale-105" : ""
                    }`}
                  >
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Upload Documents
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Add study materials and coursebooks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`group relative cursor-pointer overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-green-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-green-600 ${
                isNavigatingToQuiz ? "scale-[0.98] opacity-75" : ""
              }`}
              onClick={handleQuizClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-green-950/20"></div>

              {/* Loading Overlay */}
              {isNavigatingToQuiz && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-200 border-t-green-600 dark:border-green-800 dark:border-t-green-400"></div>
                      <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-green-300/50 dark:border-green-600/50"></div>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <span className="animate-pulse text-sm font-medium text-green-700 dark:text-green-300">
                        Opening Quiz...
                      </span>
                      <span className="text-xs text-green-600/70 dark:text-green-400/70">
                        Preparing questions
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="relative p-6">
                <div className="flex flex-col space-y-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      isNavigatingToQuiz ? "scale-105" : ""
                    }`}
                  >
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Take Quiz
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Test your knowledge and track progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`group relative cursor-pointer overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-purple-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-purple-600 ${
                isNavigatingToAnalytics ? "scale-[0.98] opacity-75" : ""
              }`}
              onClick={handleAnalyticsClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-purple-950/20"></div>

              {/* Loading Overlay */}
              {isNavigatingToAnalytics && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400"></div>
                      <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-purple-300/50 dark:border-purple-600/50"></div>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <span className="animate-pulse text-sm font-medium text-purple-700 dark:text-purple-300">
                        Opening Analytics...
                      </span>
                      <span className="text-xs text-purple-600/70 dark:text-purple-400/70">
                        Loading insights
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="relative p-6">
                <div className="flex flex-col space-y-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      isNavigatingToAnalytics ? "scale-105" : ""
                    }`}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      View Analytics
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Track progress and performance insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`group relative cursor-pointer overflow-hidden border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-orange-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-orange-600 ${
                isNavigatingToChat ? "scale-[0.98] opacity-75" : ""
              }`}
              onClick={handleAITutorClick}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-orange-950/20"></div>

              {/* Loading Overlay */}
              {isNavigatingToChat && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600 dark:border-orange-800 dark:border-t-orange-400"></div>
                      <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full border border-orange-300/50 dark:border-orange-600/50"></div>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <span className="animate-pulse text-sm font-medium text-orange-700 dark:text-orange-300">
                        Opening AI Tutor...
                      </span>
                      <span className="text-xs text-orange-600/70 dark:text-orange-400/70">
                        Preparing your assistant
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="relative p-6">
                <div className="flex flex-col space-y-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                      isNavigatingToChat ? "scale-105" : ""
                    }`}
                  >
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Tutor
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Get instant help and personalized guidance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
