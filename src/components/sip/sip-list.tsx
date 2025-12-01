"use client";

import { useUserSIPs, useCancelSIP, usePauseSIP, useResumeSIP } from "@/lib/hyperliquid/hooks-sip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Pause, Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SIPList() {
  const { data: sips, isLoading } = useUserSIPs();
  const { mutate: cancelSIP, isPending: isCancelling } = useCancelSIP();
  const { mutate: pauseSIP, isPending: isPausing } = usePauseSIP();
  const { mutate: resumeSIP, isPending: isResuming } = useResumeSIP();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sips || sips.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No SIPs yet. Create your first systematic investment plan!
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {sips.map((sip: any) => (
        <Card key={sip.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{sip.asset_name}</CardTitle>
                <CardDescription className="mt-1">
                  Monthly investment: {sip.monthly_amount_usdc} USDC
                </CardDescription>
              </div>
              {getStatusBadge(sip.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Created: {new Date(sip.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                {sip.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pauseSIP(sip.id)}
                      disabled={isPausing}
                    >
                      {isPausing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel SIP?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this SIP for {sip.asset_name}?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep it</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelSIP(sip.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, cancel SIP
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                {sip.status === "paused" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resumeSIP(sip.id)}
                      disabled={isResuming}
                    >
                      {isResuming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel SIP?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this SIP for {sip.asset_name}?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep it</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelSIP(sip.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, cancel SIP
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
