"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  GraduationCap,
  Calendar,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { api } from "@/trpc/react";

const ProgressPage = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };

  const userFirstName = session?.user?.name?.split(" ")[0] ?? "";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: recentQuizzes = [], isLoading: isLoadingQuizzes } =
    api.chat.getRecentQuizzes.useQuery({ limit: 5 });

  const calculateStats = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (recentQuizzes.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        strongTopics: 0,
        weakTopics: 0,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const totalScore = recentQuizzes.reduce(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      (sum, quiz) => sum + Math.round((quiz.score / quiz.totalQuestions) * 100),
      0,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const averageScore = Math.round(totalScore / recentQuizzes.length);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const strongTopics = recentQuizzes.filter(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (quiz) => (quiz.score / quiz.totalQuestions) * 100 >= 70,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ).length;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const weakTopics = recentQuizzes.filter(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (quiz) => (quiz.score / quiz.totalQuestions) * 100 < 50,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ).length;

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      totalQuizzes: recentQuizzes.length,
      averageScore,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      strongTopics,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      weakTopics,
    };
  };

  const overallStats = calculateStats();

  const calculateTopicPerformance = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (recentQuizzes.length === 0) {
      return [];
    }

    const topicMap = new Map<string, { correct: number; total: number }>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    recentQuizzes.forEach((quiz) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const topicName = quiz.file.name.replace(/\.(pdf|txt|docx?)$/i, ""); // Remove file extension
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const existing = topicMap.get(topicName) ?? { correct: 0, total: 0 };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      topicMap.set(topicName, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        correct: existing.correct + quiz.score,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        total: existing.total + quiz.totalQuestions,
      });
    });

    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      correct_count: data.correct,
      total_count: data.total,
    }));
  };

  const topics = calculateTopicPerformance();

  const getTopicIcon = (percentage: number) => {
    if (percentage >= 70)
      return (
        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
      );
    if (percentage < 50)
      return (
        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
      );
    return <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
  };

  const getTopicColor = (percentage: number) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage < 50) return "text-red-600";
    return "text-yellow-600";
  };

  const getProgressBarClass = (percentage: number) => {
    if (percentage >= 70) return "bg-green-600";
    if (percentage < 50) return "bg-red-600";
    return "bg-yellow-600";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                  StudySync
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
              <div className="hidden items-center space-x-2 text-sm text-gray-500 lg:flex dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">
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
                className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Your Progress, {userFirstName}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Track your learning journey and identify areas for improvement
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Quizzes
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                    {overallStats.totalQuizzes}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Average Score
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                    {overallStats.averageScore}%
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Strong Topics
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-green-600 dark:text-green-400">
                    {overallStats.strongTopics}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/50">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Needs Work
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-red-600 dark:text-red-400">
                    {overallStats.weakTopics}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topic and Recent Quizzes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Topic Performance */}
          <Card className="border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="border-b border-gray-100 pb-4 dark:border-gray-700">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Topic Performance
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                Your strengths and weaknesses by topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {topics.length === 0 ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No topic data available yet. Complete some quizzes to see
                    your performance by topic!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/quiz")}
                    className="mt-4 cursor-pointer border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                  >
                    Take a Quiz
                  </Button>
                </div>
              ) : (
                topics.map((topic) => {
                  const percentage = Math.round(
                    (topic.correct_count / topic.total_count) * 100,
                  );
                  return (
                    <div key={topic.topic} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTopicIcon(percentage)}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {topic.topic}
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${getTopicColor(percentage)}`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarClass(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {topic.correct_count} correct out of {topic.total_count}{" "}
                        questions
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card className="border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="border-b border-gray-100 pb-4 dark:border-gray-700">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Quizzes
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                Your latest quiz attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {isLoadingQuizzes ? (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading recent quizzes...
                </div>
              ) : // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              recentQuizzes.length === 0 ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No quiz attempts yet. Start generating quizzes from your
                    documents!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/quiz")}
                    className="mt-4 cursor-pointer border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                  >
                    Generate Quiz
                  </Button>
                </div>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                recentQuizzes.map((attempt) => {
                  const percentage = Math.round(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (attempt.score / attempt.totalQuestions) * 100,
                  );
                  return (
                    <div
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                      key={attempt.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                            {attempt.quiz.title}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                            {attempt.file.name}
                          </p>
                        </div>
                        <span
                          className={`font-semibold ${getTopicColor(percentage)}`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                          {attempt.score}/{attempt.totalQuestions} correct
                        </span>
                        <span>
                          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */}
                          {new Date(attempt.completedAt).toLocaleDateString(
                            "en-US",
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProgressPage;
