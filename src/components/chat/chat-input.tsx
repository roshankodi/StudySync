"use client";

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Plus, XIcon, FileText } from "lucide-react";
import { api } from "@/trpc/react";
import { fileToBase64 } from "@/lib/utils";
import type { UploadedFile } from "@/components/chat/chat-component";
import { DocumentSelector } from "@/components/chat/document-selector";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: Dispatch<SetStateAction<UploadedFile[]>>;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  uploadedFiles,
  setUploadedFiles,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadfileMutation = api.chat.uploadFiles.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const handleFileUpload = async (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      isUploading: true,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    const uploadPromises = Array.from(selectedFiles).map(
      async (file, index) => {
        try {
          const base64 = await fileToBase64(file);

          const {
            files: [uploadedFile],
          } = await uploadfileMutation.mutateAsync({
            base64Files: [
              {
                name: file.name,
                type: file.type,
                base64,
              },
            ],
          });

          if (uploadedFile?.id) {
            setUploadedFiles((prev) =>
              prev.map((f) => {
                if (f.id === newFiles[index]?.id) {
                  return { ...f, id: uploadedFile.id, isUploading: false };
                }
                return f;
              }),
            );
          } else {
            setUploadedFiles((prev) =>
              prev.filter((f) => f.id !== newFiles[index]?.id),
            );
          }
        } catch (error) {
          console.error("Error uploading file", error);
          setUploadedFiles((prev) =>
            prev.filter((f) => f.id !== newFiles[index]?.id),
          );
        }
      },
    );

    await Promise.allSettled(uploadPromises);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await handleFileUpload(selectedFiles);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleSelectDocuments = (documents: UploadedFile[]) => {
    setUploadedFiles((prev) => {
      const existingIds = prev.map((file) => file.id);
      const newDocuments = documents.filter(
        (doc) => !existingIds.includes(doc.id),
      );
      return [...prev, ...newDocuments];
    });
  };

  const handleOpenDocumentSelector = () => {
    setShowDocumentSelector(true);
  };

  const handleCloseDocumentSelector = () => {
    setShowDocumentSelector(false);
  };
  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        {uploadedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="relative flex items-center space-x-3 rounded-xl border border-gray-200 bg-gray-50 p-3 pr-8 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                  {file.isUploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg
                      className="h-5 w-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="max-w-[200px] truncate text-sm font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full border border-gray-300 bg-white hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={() => removeFile(file.id)}
                >
                  <XIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center space-x-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-2 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800/50 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20 dark:hover:border-gray-500">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0 cursor-pointer rounded-xl text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 dark:focus-visible:ring-blue-400/40"
              disabled={disabled}
              onClick={handleFileSelect}
              title="Upload new document"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0 cursor-pointer rounded-xl text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 dark:focus-visible:ring-blue-400/40"
              disabled={disabled}
              onClick={handleOpenDocumentSelector}
              title="Select from uploaded documents"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            <Input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="flex-1 border-0 bg-transparent px-2 text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 dark:px-0 dark:text-gray-100 dark:placeholder:text-gray-400"
            />

            <div className="flex flex-shrink-0 items-center space-x-1">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer rounded-xl text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:outline-none disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 dark:focus-visible:ring-blue-400/40"
                disabled={
                  disabled ||
                  !input.trim() ||
                  uploadedFiles.some((file) => file.isUploading)
                }
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

        {showDocumentSelector && (
          <DocumentSelector
            onSelectDocuments={handleSelectDocuments}
            onClose={handleCloseDocumentSelector}
            selectedDocumentIds={uploadedFiles.map((file) => file.id)}
          />
        )}
      </div>
    </div>
  );
}
