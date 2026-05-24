"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Streamdown } from "streamdown";
import rehypeRaw from "rehype-raw";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ChatInput } from "@/components/chat/chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PdfViewer } from "@/components/pdf/pdf-viewer";

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

interface ChatComponentProps {
  chatId?: string;
}
interface CitationData {
  citedText: string;
  pageNumber?: number;
  fileUrl: string;
  sourceId: string;
  fileId: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  isUploading: boolean;
}

export function ChatComponent({ chatId }: ChatComponentProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [citationData, setCitationData] = useState<CitationData | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [lastSubmittedFiles, setLastSubmittedFiles] = useState<UploadedFile[]>(
    [],
  );
  const utils = api.useUtils();

  const { data: chatData } = api.chat.getById.useQuery(
    { id: chatId! },
    { enabled: !!chatId },
  );

  const { messages, status, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: {
          message: messages.at(-1)?.parts.find((part) => part.type === "text")
            ?.text,
          chatId,
          ...body,
        },
      }),
    }),
    onData: (data) => {
      if (data.type === "data-chatId") {
        const newChatId = (data.data as { chatId: string }).chatId;
        utils.chat.getById
          .prefetch({ id: newChatId })
          .then(() => {
            router.push(`/chat/${newChatId}`);
          })
          .catch((e) => {
            console.error("Error in prefetch:", e);
          });
      }
    },
    onFinish: () => {
      void utils.chat.getById.invalidate();
      setLastSubmittedFiles([]);
    },
  });

  useEffect(() => {
    if (chatData?.messages) {
      const uiMessages: UIMessage[] = chatData.messages.map((message) => ({
        id: message.id,
        role:
          message.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: message.content,
        createdAt: message.createdAt,
        parts: [{ type: "text", text: message.content }],
      }));
      setMessages(uiMessages);
    }
  }, [chatData?.messages, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  const lastMessage = messages[messages.length - 1];
  const hasResponseContent =
    lastMessage?.role === "assistant" &&
    lastMessage.parts?.some(
      (part) => part.type === "text" && part.text && part.text.length > 0,
    );

  const isWaitingForResponse =
    (status === "submitted" || status === "streaming") && !hasResponseContent;

  const handleCitationClick = ({
    messageId,
    citedText,
    pageNumber,
    fileId,
    sourceId,
  }: {
    messageId: string;
    citedText: string;
    pageNumber: number;
    fileId: string;
    sourceId: string;
  }) => {
    const message = chatData?.messages.find((msg) => msg.id === messageId);
    const fileSource =
      message?.messageSources[+sourceId - 1] ??
      message?.messageSources.find((file) => file.fileId === fileId);
    if (!message || !fileSource) return;

    setCitationData({
      citedText,
      pageNumber,
      fileUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${fileSource.file.supabasePath}`,
      sourceId,
      fileId,
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMessageSubmit = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const fileIds = uploadedFiles
      .filter((file) => !file.isUploading)
      .map((file) => file.id);

    const filesToSubmit = uploadedFiles.filter((file) => !file.isUploading);
    setLastSubmittedFiles(filesToSubmit);

    setUploadedFiles([]);

    await sendMessage({ text: messageText }, { body: { fileIds } });
  };

  return (
    <div className="bg-background flex h-full min-h-0 flex-col overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize={citationData ? 60 : 100} minSize={40}>
          <div className="flex h-full min-h-0 flex-col">
            <ScrollArea className="min-h-0 flex-1 p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex h-full w-full flex-col items-center justify-center text-center">
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    What would you like to research?
                  </h1>
                </div>
              ) : (
                <div className="mx-auto max-w-4xl space-y-4">
                  {messages.map((message, index) => {
                    const messageData = chatData?.messages.find(
                      (msg) => msg.id === message.id,
                    );

                    const isNewMessage = !messageData;
                    const isLastUserMessage =
                      message.role === "user" && index === messages.length - 2;
                    const isLastMessage = index === messages.length - 1;

                    let filesToDisplay: Array<{
                      file: { id: string; name: string };
                    }> = [];

                    if (messageData?.messageFiles) {
                      filesToDisplay = messageData.messageFiles;
                    } else if (isNewMessage && message.role === "user") {
                      if (isLoading && lastSubmittedFiles.length > 0) {
                        filesToDisplay = lastSubmittedFiles.map((f) => ({
                          file: { id: f.id, name: f.name },
                        }));
                      } else if (!isLoading && uploadedFiles.length > 0) {
                        filesToDisplay = uploadedFiles
                          .filter((f) => !f.isUploading)
                          .map((f) => ({ file: { id: f.id, name: f.name } }));
                      }
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex space-x-2 ${
                            message.role === "user"
                              ? "max-w-[80%] flex-row-reverse space-x-reverse"
                              : ""
                          }`}
                        >
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border-border text-card-foreground border"
                            }`}
                          >
                            {/* Display attached files */}
                            {filesToDisplay.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {filesToDisplay.map((messageFile) => (
                                  <div
                                    key={messageFile.file.id}
                                    className="border-border bg-card flex items-center space-x-2 rounded-xl border px-3 py-2 shadow-sm"
                                  >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
                                      <svg
                                        className="h-4 w-4 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-card-foreground max-w-[150px] truncate text-xs font-medium">
                                        {messageFile.file.name}
                                      </p>
                                      <p className="text-muted-foreground text-xs">
                                        PDF
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">
                              {message.parts
                                ?.filter((part) => part.type === "text")
                                .map((part, _index) => (
                                  <Streamdown
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                      // @ts-expect-error dynamic props
                                      citation: ({
                                        children,
                                        ...rest
                                      }: {
                                        children: React.ReactNode;
                                        "cited-text": string;
                                        "file-page-number": number;
                                        "file-id": string;
                                        "source-id": string;
                                      }) => (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span
                                              className="citation-badge ml-0.5 inline-flex h-5 w-auto min-w-[1.2rem] cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1.5 text-xs font-medium text-blue-700 transition-all duration-200 hover:scale-105 hover:border-blue-300 hover:bg-blue-100 hover:shadow-sm active:scale-95 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/50"
                                              onClick={() =>
                                                handleCitationClick({
                                                  messageId: message.id,
                                                  citedText: rest["cited-text"],
                                                  pageNumber: rest["file-page-number"],
                                                  fileId: rest["file-id"],
                                                  sourceId: rest["source-id"],
                                                })
                                              }
                                            >
                                              {typeof children === "string" ||
                                              typeof children === "number"
                                                ? String(children).replace(
                                                    /[\[\]]/g,
                                                    "",
                                                  )
                                                : children}
                                            </span>
                                          </TooltipTrigger>

                                          <TooltipContent className="citation-tooltip max-w-sm p-3 text-sm">
                                            <div className="space-y-1">
                                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                                Source Reference
                                              </p>
                                              <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                                {rest["cited-text"]}
                                              </p>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      ),
                                    }}
                                    key={_index}
                                  >
                                    {part.text}
                                  </Streamdown>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Loading indicator before response starts */}
                  {isWaitingForResponse && (
                    <div className="flex justify-start">
                      <div className="flex space-x-2">
                        <div className="bg-card border-border text-card-foreground rounded-lg border px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div
                                className="bg-primary h-2 w-2 animate-bounce rounded-full"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="bg-primary h-2 w-2 animate-bounce rounded-full"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="bg-primary h-2 w-2 animate-bounce rounded-full"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <ChatInput
              onSubmit={handleMessageSubmit}
              disabled={isLoading}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          </div>
        </ResizablePanel>

        {citationData && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="border-border bg-card flex h-full flex-col border-l">
                <div className="bg-muted/50 border-border flex items-center justify-between border-b p-4">
                  <h2 className="text-card-foreground text-sm font-medium">
                    Source Document
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCitationData(null)}
                  >
                    <XIcon />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <PdfViewer
                    textToHighlight={citationData.citedText}
                    initialPage={citationData.pageNumber}
                    fileUrl={citationData.fileUrl}
                    fileId={citationData.fileId}
                  />
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
