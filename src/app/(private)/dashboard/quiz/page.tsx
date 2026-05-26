"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  GraduationCap,
  Calendar,
  LogOut,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { ThemeToggle } from "@/components/theme-toggle";

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  topic: string;
}

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };
  const [stage, setStage] = useState<"generate" | "quiz" | "result">(
    "generate",
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [quizType, setQuizType] = useState<string>("");
  const [numberOfQuestions, setNumberOfQuestions] = useState<string>("");
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>(
    [],
  );
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number>(0);

  const { data: userDocuments = [], isLoading: isLoadingDocuments } =
    api.chat.listFiles.useQuery();

  const saveQuizAttemptMutation = api.chat.saveQuizAttempt.useMutation();

  const isAnswerCorrect = (
  question: QuizQuestion,
  userAnswer?: string,
) => {
  if (userAnswer === undefined || userAnswer.trim() === "") {
    return false;
  }

  // MCQ
  if (question.options && question.options.length > 0) {
    return parseInt(userAnswer) === question.correctAnswer;
  }

  // SAQ / LAQ
  const normalizedUser = userAnswer
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "");

  const normalizedCorrect = String(question.correctAnswer)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "");

  // Exact inclusion check
  if (
    normalizedCorrect.includes(normalizedUser) ||
    normalizedUser.includes(normalizedCorrect)
  ) {
    return true;
  }

  const correctWords = normalizedCorrect
    .split(/\s+/)
    .filter(Boolean);

  const userWords = normalizedUser
    .split(/\s+/)
    .filter(Boolean);

  const matchedWords = userWords.filter((word) =>
    correctWords.includes(word),
  );

  // Compare against USER answer length instead
  const similarity =
    matchedWords.length / Math.max(userWords.length, 1);

  return similarity >= 0.6;
};

const calculateScore = () => {
  let correct = 0;

  generatedQuestions.forEach((question, index) => {
    if (isAnswerCorrect(question, userAnswers[index])) {
      correct++;
    }
  });

  return correct;
};

  useEffect(() => {
    const docId = searchParams.get("docId");
    if (docId && userDocuments.length > 0) {
      const documentExists = userDocuments.some((doc) => doc.id === docId);
      if (documentExists) {
        setSelectedDocument(docId);
      }
    }
  }, [searchParams, userDocuments]);

  const generateQuizMutation = api.chat.generateQuiz.useMutation();

  const selectedDoc = userDocuments.find((doc) => doc.id === selectedDocument);

  const handleGenerateQuiz = async () => {
    if (!selectedDocument || !quizType || !numberOfQuestions) {
      return;
    }

    try {
      setIsGeneratingQuiz(true);
      const result = await generateQuizMutation.mutateAsync({
        fileId: selectedDocument,
        quizType: quizType as "MCQ" | "SAQ" | "LAQ",
        numberOfQuestions: parseInt(numberOfQuestions),
      });

      setGeneratedQuestions(result.questions as QuizQuestion[]);
      setCurrentQuestion(0);
      setStage("quiz");
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleNewQuiz = () => {
    setStage("generate");
    setCurrentQuestion(0);
    setGeneratedQuestions([]);
    setSelectedDocument("");
    setQuizType("");
    setNumberOfQuestions("");
    setUserAnswers({});
    setQuizScore(0);
  };

  const currentQ = generatedQuestions[currentQuestion];
  const isMCQ = currentQ?.options && currentQ.options.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Minimal Clean Header - Matching Dashboard */}
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

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {stage === "generate" && (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Generate Quiz
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create AI-powered quizzes from your coursebooks
              </p>
            </div>

            <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Document
                  </Label>
                  <Select
                    value={selectedDocument}
                    onValueChange={setSelectedDocument}
                  >
                    <SelectTrigger className="h-11 cursor-pointer border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue
                        placeholder={
                          isLoadingDocuments
                            ? "Loading documents..."
                            : userDocuments.length === 0
                              ? "No documents uploaded yet"
                              : "Choose a document"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                       className="
                       z-50
                       max-h-60
                        overflow-y-auto
                        rounded-md
                       border
                       bg-white
                       dark:bg-gray-800
                     "
                    >
                      {isLoadingDocuments ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading documents...
                          </div>
                        </SelectItem>
                      ) : userDocuments.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          <div className="text-gray-500">
                            No documents found. Please upload documents first.
                          </div>
                        </SelectItem>
                      ) : (
                        userDocuments.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quiz Type
                  </Label>
                  <Select value={quizType} onValueChange={setQuizType}>
                    <SelectTrigger className="h-11 cursor-pointer border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      className="
                        z-50
                        max-h-60
                        overflow-y-auto
                        rounded-md
                        border
                        bg-white
                        dark:bg-gray-800
                      "
                    >

                      <SelectItem value="MCQ">Multiple Choice</SelectItem>
                      <SelectItem value="SAQ">Short Answer</SelectItem>
                      <SelectItem value="LAQ">Long Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Questions
                  </Label>
                  <Select
                    value={numberOfQuestions}
                    onValueChange={setNumberOfQuestions}
                  >
                    <SelectTrigger className="h-11 cursor-pointer border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={5}
                      className="
                        z-50
                        max-h-60
                        overflow-y-auto
                        rounded-md
                        border
                        bg-white
                        dark:bg-gray-800
                      "
                    >
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedDoc && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-950/50">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Selected Document:</span>{" "}
                      {selectedDoc.name}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      {(selectedDoc.size / 1024 / 1024).toFixed(1)} MB •
                      Uploaded{" "}
                      {new Date(selectedDoc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateQuiz}
                  className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !selectedDocument ||
                    !quizType ||
                    !numberOfQuestions ||
                    isLoadingDocuments ||
                    userDocuments.length === 0 ||
                    isGeneratingQuiz
                  }
                >
                  {isGeneratingQuiz ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Generate Quiz"
                  )}
                </Button>

                {userDocuments.length === 0 && !isLoadingDocuments ? (
                  <div className="text-center">
                    <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
                      No documents found. Please upload documents first to
                      generate quizzes.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/documents")}
                      className="cursor-pointer border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                    >
                      Upload Documents
                    </Button>
                  </div>
                ) : !selectedDocument || !quizType || !numberOfQuestions ? (
                  <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                    Please select a document, quiz type, and number of questions
                    to generate quiz
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        {stage === "quiz" && (
          <div className="space-y-6">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Question {currentQuestion + 1} of {generatedQuestions.length}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {currentQ?.topic}
                </p>
              </div>
              <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {currentQuestion + 1}/{generatedQuestions.length}
                </span>
              </div>
            </div>

            <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="space-y-6 p-6">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {currentQ?.question}
                </p>

                {isMCQ ? (
                  <RadioGroup
                    className="space-y-3"
                    value={userAnswers[currentQuestion] ?? ""}
                    onValueChange={(value) => {
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestion]: value,
                      }));
                    }}
                  >
                    {currentQ.options?.map((option: string, idx: number) => (
                      <Label
                        key={idx}
                        htmlFor={`option-${idx}`}
                        className="flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/50"
                      >
                        <RadioGroupItem
                          value={idx.toString()}
                          id={`option-${idx}`}
                          className="border-gray-300 dark:border-gray-500"
                        />
                        <span className="flex-1 text-gray-700 dark:text-gray-300">
                          {option}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    placeholder="Type your answer here..."
                    rows={6}
                    value={userAnswers[currentQuestion] ?? ""}
                    onChange={(e) => {
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestion]: e.target.value,
                      }));
                    }}
                    className="
                      resize-none
                      border-gray-200
                      focus:border-blue-500
                      focus:ring-blue-500
                      dark:border-gray-600
                      dark:bg-gray-700
                      dark:text-white
                    "
                  />
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentQuestion(Math.max(0, currentQuestion - 1))
                    }
                    disabled={currentQuestion === 0}
                    className="cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                  {currentQuestion < generatedQuestions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestion(currentQuestion + 1)}
                      className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700"
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        const score = calculateScore();
                        setQuizScore(score);

                        if (selectedDocument && quizType) {
                          try {
                            await saveQuizAttemptMutation.mutateAsync({
                              fileId: selectedDocument,
                              quizType: quizType as "MCQ" | "SAQ" | "LAQ",
                              numberOfQuestions: generatedQuestions.length,
                              score,
                              answers: userAnswers,
                              title: selectedDoc?.name
                                ? `Quiz: ${selectedDoc.name}`
                                : "Untitled Quiz",
                            });
                          } catch (error) {
                            console.error("Error saving quiz attempt:", error);
                          }
                        }

                        setStage("result");
                      }}
                      className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700"
                    >
                      Submit Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stage === "result" && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Quiz Results
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Here&apos;s how you performed
              </p>
            </div>

            {/* Score Card */}
            <Card className="border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="mb-2 text-6xl font-bold text-blue-600">
                    {Math.round((quizScore / generatedQuestions.length) * 100)}%
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {quizScore} out of {generatedQuestions.length} correct
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Question Review */}
            <div className="space-y-4">
              {generatedQuestions.map((q: QuizQuestion, idx: number) => {
                const userAnswer = userAnswers[idx];
                const isCorrect = isAnswerCorrect(q, userAnswer);

                return (
                  <Card
                    key={idx}
                    className="border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {isCorrect ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/50">
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="mb-3 font-semibold text-gray-900 dark:text-white">
                            {q.question}
                          </p>
                          {q.options && q.options.length > 0 ? (
                            <>
                              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                Your answer:{" "}
                                <span className="font-medium">
                                  {userAnswer !== undefined
                                    ? q.options[parseInt(userAnswer)]
                                    : "Not answered"}
                                </span>
                              </p>

                              <p className="mb-3 text-sm text-green-600 dark:text-green-400">
                                Correct answer:{" "}
                                <span className="font-medium">
                                  {typeof q.correctAnswer === "number"
                                    ? q.options[q.correctAnswer]
                                    : q.correctAnswer}
                                </span>
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                                Your answer:{" "}
                                <span className="font-medium">
                                  {userAnswer ?? "Not answered"}
                                </span>
                              </p>

                              <p className="mb-3 text-sm text-green-600 dark:text-green-400">
                                Correct answer:{" "}
                                <span className="font-medium">
                                  {q.correctAnswer}
                                </span>
                              </p>
                            </>
                          )}
                          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/50">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                Explanation:{" "}
                              </span>
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleNewQuiz}
                className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                New Quiz
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizPageContent />
    </Suspense>
  );
}
