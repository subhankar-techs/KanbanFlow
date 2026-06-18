"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserPlus, X, Crown, Users, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import * as memberService from "@/services/memberService";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/utils";

interface Member {
  id: string;
  board_id: string;
  user_id: string;
  role: "owner" | "member";
  invited_at: string;
  profile: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  };
}

interface BoardMembersProps {
  boardId: string;
  ownerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardMembers({
  boardId,
  ownerId,
  open,
  onOpenChange,
}: BoardMembersProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = user?.id === ownerId;

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await memberService.getMembers(boardId);
      setMembers(data as Member[]);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      await memberService.inviteMember(boardId, inviteEmail.trim());
      toast.success("Member invited successfully!");
      setInviteEmail("");
      fetchMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to invite member"
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      setRemovingId(userId);
      await memberService.removeMember(boardId, userId);
      toast.success("Member removed");
      fetchMembers();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Board Members
          </DialogTitle>
        </DialogHeader>

        {/* Invite Section */}
        {isOwner && (
          <>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Invite by email..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0"
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Separator />
          </>
        )}

        {/* Members List */}
        <ScrollArea className="max-h-[300px]">
          {loading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-pulse"
                >
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2.5 bg-muted rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-primary">
                      {getInitials(member.profile.name, member.profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {member.profile.name || member.profile.email}
                      </p>
                      {member.role === "owner" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20"
                        >
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.profile.email}
                    </p>
                  </div>
                  {isOwner && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={removingId === member.user_id}
                    >
                      {removingId === member.user_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <p className="text-xs text-muted-foreground">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
