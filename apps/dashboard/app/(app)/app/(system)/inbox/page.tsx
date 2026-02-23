"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarText } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Archive,
  Bold,
  Inbox,
  Italic,
  Link2,
  List,
  ListOrdered,
  Paperclip,
  PencilLine,
  Quote,
  Reply,
  Search,
  Send,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";

type MailFolder = "inbox" | "starred" | "sent" | "archive";

type MailMessage = {
  id: string;
  folder: MailFolder;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  preview: string;
  body: string;
  unread: boolean;
  starred: boolean;
  createdAt: string;
};

const MESSAGES: MailMessage[] = [
  {
    id: "m_001",
    folder: "inbox",
    fromName: "Jordan Miles",
    fromEmail: "jordan@oakridgeinspections.com",
    toEmail: "support@inspectos.co",
    subject: "Question about inspector seat limit",
    preview: "We are onboarding two new inspectors this week and want to confirm plan limits.",
    body:
      "Hi team,\n\nWe are onboarding two new inspectors this week and want to confirm the current plan seat limit before we assign accounts.\n\nCan you also confirm whether the overage is prorated mid-cycle?\n\nThanks,\nJordan",
    unread: true,
    starred: true,
    createdAt: "2026-02-20T16:40:00.000Z",
  },
  {
    id: "m_002",
    folder: "inbox",
    fromName: "Avery Thompson",
    fromEmail: "avery@northfieldproperty.ca",
    toEmail: "support@inspectos.co",
    subject: "SMTP fallback behavior verification",
    preview: "We left SMTP empty and emails are still delivering, just confirming expected behavior.",
    body:
      "Hello,\n\nWe left tenant SMTP empty and emails are still delivering from your platform sender. We just want to confirm this is expected until we configure our own credentials.\n\nRegards,\nAvery",
    unread: false,
    starred: false,
    createdAt: "2026-02-20T13:12:00.000Z",
  },
  {
    id: "m_003",
    folder: "sent",
    fromName: "InspectOS Support",
    fromEmail: "support@inspectos.co",
    toEmail: "ops@brightlinehome.com",
    subject: "Welcome to InspectOS onboarding",
    preview: "Your workspace is ready. Here are your next setup steps and resources.",
    body:
      "Hi,\n\nYour workspace is now active. Next steps:\n1. Complete company settings\n2. Invite team members\n3. Configure branding and SMTP\n\nReply if you need help.\n\nInspectOS Support",
    unread: false,
    starred: false,
    createdAt: "2026-02-19T21:07:00.000Z",
  },
  {
    id: "m_004",
    folder: "archive",
    fromName: "Kai Rivera",
    fromEmail: "kai@insightsinspections.io",
    toEmail: "support@inspectos.co",
    subject: "Seat pricing clarification",
    preview: "Thanks for clarifying Growth vs Team break-even.",
    body:
      "Thanks for clarifying Growth vs Team break-even. That answered what we needed.\n\nBest,\nKai",
    unread: false,
    starred: false,
    createdAt: "2026-02-18T11:25:00.000Z",
  },
];

const FOLDERS: Array<{ key: MailFolder; label: string; icon: typeof Inbox }> = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "archive", label: "Archive", icon: Archive },
];

export default function InboxPage() {
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [query, setQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(MESSAGES[0]?.id ?? null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const playSendSwoosh = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const context = new AudioContextClass();
      const now = context.currentTime;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(920, now);
      oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.18);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.22);
      oscillator.onended = () => {
        void context.close();
      };
    } catch {
      // Ignore audio failures to avoid interrupting send flow.
    }
  };
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({
        placeholder: "Write your message...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] p-3 text-sm leading-6 text-foreground focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setComposeBody(currentEditor.getHTML());
    },
  });

  const handleToggleLink = () => {
    if (!editor) return;
    const existingUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", existingUrl ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const handleSend = () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast.error("Recipient and subject are required");
      return;
    }
    if (!composeBody.trim()) {
      toast.error("Add a message before sending");
      return;
    }
    playSendSwoosh();
    toast.success("Message sent");
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    editor?.commands.clearContent();
    setIsComposeOpen(false);
  };

  const filteredMessages = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return MESSAGES.filter((message) => {
      const inFolder = folder === "starred" ? message.starred : message.folder === folder;
      if (!inFolder) return false;
      if (!lowered) return true;
      return (
        message.fromName.toLowerCase().includes(lowered) ||
        message.fromEmail.toLowerCase().includes(lowered) ||
        message.subject.toLowerCase().includes(lowered) ||
        message.preview.toLowerCase().includes(lowered)
      );
    });
  }, [folder, query]);

  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedId) ?? filteredMessages[0] ?? null;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Inbox"
        description="Shared business mailbox with one place to monitor delivery, replies, and support threads."
        actions={
          <Button onClick={() => setIsComposeOpen((open) => !open)}>
            <PencilLine className="mr-2 h-4 w-4" />
            {isComposeOpen ? "Close Compose" : "Compose"}
          </Button>
        }
      />

      <div
        className={cn(
          "overflow-hidden rounded-sm border bg-card shadow-sm transition-all duration-300",
          isComposeOpen ? "max-h-[680px] opacity-100" : "max-h-0 border-transparent opacity-0"
        )}
      >
        <div className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compose Message</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="email"
              placeholder="To"
              value={composeTo}
              onChange={(event) => setComposeTo(event.target.value)}
            />
            <Input
              placeholder="Subject"
              value={composeSubject}
              onChange={(event) => setComposeSubject(event.target.value)}
            />
          </div>
          <div className="rounded-sm border">
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", editor?.isActive("bold") ? "bg-muted text-foreground" : "")}
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", editor?.isActive("italic") ? "bg-muted text-foreground" : "")}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", editor?.isActive("bulletList") ? "bg-muted text-foreground" : "")}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={!editor}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", editor?.isActive("orderedList") ? "bg-muted text-foreground" : "")}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                disabled={!editor}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", editor?.isActive("link") ? "bg-muted text-foreground" : "")}
                onClick={handleToggleLink}
                disabled={!editor}
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2", editor?.isActive("blockquote") ? "bg-muted text-foreground" : "")}
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                disabled={!editor}
              >
                <Quote className="h-4 w-4" />
              </Button>
              <span className="mx-1 h-5 w-px bg-border" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => editor?.chain().focus().insertContent("<p>Thanks,<br />InspectOS Team</p>").run()}
                disabled={!editor}
              >
                Signature
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => editor?.chain().focus().insertContent("<p>Let me know if you have any questions.</p>").run()}
                disabled={!editor}
              >
                Quick Reply
              </Button>
            </div>
            <EditorContent editor={editor} className="[&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:max-h-[320px] [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:break-words" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" type="button">
              <Paperclip className="mr-1.5 h-3.5 w-3.5" />
              Attach
            </Button>
            <Button type="button" onClick={handleSend}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:h-[calc(100vh-13rem)] xl:grid-cols-[240px_360px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3 rounded-sm border bg-card p-3 shadow-sm xl:overflow-y-auto">
          <div className="px-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</p>
          </div>
          <div className="space-y-1">
            {FOLDERS.map((item) => {
              const count =
                item.key === "starred"
                  ? MESSAGES.filter((message) => message.starred).length
                  : MESSAGES.filter((message) => message.folder === item.key).length;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFolder(item.key)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors",
                    folder === item.key
                      ? "bg-brand-500 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className={cn("text-xs", folder === item.key ? "text-white/90" : "text-muted-foreground")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        <div className="min-w-0 h-[70vh] rounded-sm border bg-card p-3 shadow-sm xl:h-full xl:min-h-0 xl:overflow-hidden xl:flex xl:flex-col">
          <div className="mb-3 relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages"
              className="pl-8"
            />
          </div>

          <div className="min-h-0 h-[calc(70vh-3.75rem)] overflow-y-auto overflow-x-hidden pr-1 xl:h-auto xl:flex-1">
            <div className="max-w-full space-y-2">
              {filteredMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  className={cn(
                    "block w-full max-w-full overflow-hidden rounded-sm border p-3 text-left transition-all hover:shadow-sm",
                    selectedMessage?.id === message.id
                      ? "border-brand-500 bg-brand-50/70 dark:bg-brand-900/20"
                      : "border-border bg-background"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold">{message.fromName}</p>
                    <p className="shrink-0 text-[11px] text-muted-foreground">
                      {format(new Date(message.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <p className="block min-w-0 max-w-full truncate text-sm font-medium text-foreground">{message.subject}</p>
                  <p className="block min-w-0 max-w-full truncate text-xs text-muted-foreground">{message.preview}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {message.unread ? <Badge color="light">Unread</Badge> : null}
                    {message.starred ? <Badge color="light">Starred</Badge> : null}
                  </div>
                </button>
              ))}
              {filteredMessages.length === 0 ? (
                <div className="rounded-sm border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No messages found.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-sm border bg-card shadow-sm xl:min-h-0 xl:overflow-hidden">
          {selectedMessage ? (
            <div className="flex h-full min-h-[60vh] flex-col">
              <div className="border-b px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-semibold text-foreground">{selectedMessage.subject}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(selectedMessage.createdAt), "EEEE, MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      {selectedMessage.starred ? <Star className="h-4 w-4 text-amber-500" /> : <StarOff className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-b px-5 py-3">
                <div className="flex items-center gap-3">
                  <AvatarText name={selectedMessage.fromName} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{selectedMessage.fromName}</p>
                    <p className="truncate text-xs text-muted-foreground">{selectedMessage.fromEmail}</p>
                  </div>
                  <div className="ml-auto text-right text-xs text-muted-foreground">
                    <p>To</p>
                    <p className="break-all">{selectedMessage.toEmail}</p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 px-5 py-4">
                <p className="whitespace-pre-line break-words text-sm leading-7 text-foreground">{selectedMessage.body}</p>
              </ScrollArea>

              <div className="border-t px-5 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <Reply className="mr-2 h-4 w-4" />
                    Reply
                  </Button>
                  <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Forward
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
              Select a message to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
