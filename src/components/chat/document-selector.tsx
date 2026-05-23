"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/trpc/react";
import { FileText, Check, X } from "lucide-react";
import type { UploadedFile } from "@/components/chat/chat-component";

interface DocumentSelectorProps {
  onSelectDocuments: (documents: UploadedFile[]) => void;
  onClose: () => void;
  selectedDocumentIds: string[];
}

export function DocumentSelector({
  onSelectDocuments,
  onClose,
  selectedDocumentIds,
}: DocumentSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedDocumentIds);

  const { data: files, isLoading } = api.chat.listFiles.useQuery();

  const handleToggleDocument = (fileId: string, _fileName: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (!files) return;

    const selectedDocuments: UploadedFile[] = files
      .filter((file) => selectedIds.includes(file.id))
      .map((file) => ({
        id: file.id,
        name: file.name,
        type: file.fileType,
        isUploading: false,
      }));

    onSelectDocuments(selectedDocuments);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-900">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">
              Loading documents...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Documents
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Document List */}
        <ScrollArea className="flex-1 p-6">
          {!files || files.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                No documents found. Upload some documents first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const isSelected = selectedIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                    onClick={() => handleToggleDocument(file.id, file.name)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <div className="mt-1 flex items-center space-x-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 p-6 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.length} document{selectedIds.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedIds.length === 0}
            >
              Add Selected Documents
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
