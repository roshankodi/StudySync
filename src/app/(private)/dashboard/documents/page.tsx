"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Eye,
  GraduationCap,
  Calendar,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { fileToBase64 } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  isUploading: boolean;
}

export default function DocumentsPage() {
  const router = useRouter();

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const {
    data: documents = [],
    refetch: refetchFiles,
    isLoading: isLoadingFiles,
  } = api.chat.listFiles.useQuery();
  const uploadfileMutation = api.chat.uploadFiles.useMutation();
  const deleteFileMutation = api.chat.deleteFile.useMutation();

  const handleFileUpload = async (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      isUploading: true,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    const uploadPromises = newFiles.map(async (newFile) => {
      try {
        const originalFile = Array.from(selectedFiles).find(
          (f) => f.name === newFile.name,
        );
        if (!originalFile) throw new Error("Original file not found");

        const base64 = await fileToBase64(originalFile);

        await uploadfileMutation.mutateAsync({
          base64Files: [
            {
              name: originalFile.name,
              type: originalFile.type,
              base64,
            },
          ],
        });

        // Mark the file as 'done' uploading in the temporary state
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id ? { ...f, isUploading: false } : f,
          ),
        );
      } catch (error) {
        console.error("Error uploading file:", newFile.name, error);
        // On error, remove it from the uploading list
        setUploadedFiles((prev) => prev.filter((f) => f.id !== newFile.id));
      }
    });

    // Wait for ALL uploads to finish.
    await Promise.allSettled(uploadPromises);

    // NOW, refetch the document list just ONCE.
    await refetchFiles();

    // FINALLY, clear the temporary uploading state.
    setUploadedFiles([]);
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    setSelectedFiles(files);
  };

  const handleUploadClick = async () => {
    if (selectedFiles && selectedFiles.length > 0) {
      await handleFileUpload(selectedFiles);
      setSelectedFiles(null);
      const fileInput = document.querySelector('input[type="file"]');
      //@ts-expect-error - fileInput type needs to be cast to HTMLInputElement
      if (fileInput) fileInput.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFileMutation.mutateAsync({ fileId });
      void refetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // --- DERIVED STATE FOR RENDERING ---
  // This is the single source of truth for what should be in the "Uploading Files" card.
  const filesCurrentlyUploading = uploadedFiles.filter((file) => {
    const isInDocuments = documents.some((doc) => doc.name === file.name);
    return file.isUploading && !isInDocuments;
  });

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
                  StudySync <span className="text-blue-500">LM</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Documents
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Upload and manage your coursebooks
          </p>
        </div>

        <Card className="mb-8 border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upload New Document
                </h2>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  max 50MB
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="flex-1 cursor-pointer border-gray-200 pl-10 file:mr-3 file:pl-2 focus-visible:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={handleFileInputChange}
                />
              </div>
              <Button
                className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                onClick={handleUploadClick}
                disabled={
                  !selectedFiles ||
                  selectedFiles.length === 0 ||
                  uploadfileMutation.isPending
                }
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadfileMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {selectedFiles && selectedFiles.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-700">
                <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="space-y-2">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    >
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- FIXED UPLOADING FILES CARD --- */}
        {filesCurrentlyUploading.length > 0 && (
          <Card className="mb-8 border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50">
            <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-amber-800 dark:text-amber-200">
                Uploading Files
              </h3>
              <div className="space-y-3">
                {filesCurrentlyUploading.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 dark:bg-gray-800"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent dark:border-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-900 dark:text-amber-100">
                        {file.name}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Uploading...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Documents
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {doc.name}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 flex-1 cursor-pointer bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700"
                      onClick={() =>
                        router.push(`/dashboard/quiz?docId=${doc.id}`)
                      }
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Quiz
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 cursor-pointer border-gray-200 px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                      onClick={() => handleDeleteFile(doc.id)}
                      disabled={deleteFileMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State or Loading */}
            {isLoadingFiles ? (
              <Card className="col-span-full border border-gray-100 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent dark:border-gray-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Loading documents...
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please wait while we fetch your files
                </p>
              </Card>
            ) : documents.length === 0 && uploadedFiles.length === 0 ? (
              <Card className="col-span-full border border-gray-100 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  No documents yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload your first coursebook to get started
                </p>
              </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
