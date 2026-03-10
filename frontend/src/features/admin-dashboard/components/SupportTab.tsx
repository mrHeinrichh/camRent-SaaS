import { Download, MessageSquare, Trash2 } from 'lucide-react';
import { Button, Card } from '@/src/components/ui';
import type { SupportTicket } from '@/src/types/domain';
import { useEffect, useState } from 'react';

interface SupportTabProps {
  tickets: SupportTicket[];
  onExport: () => void;
  onUpdateTicket: (id: string, payload: { status?: SupportTicket['status']; priority?: SupportTicket['priority']; admin_reply?: string }) => Promise<void>;
  onDeleteTicket: (id: string) => Promise<void>;
}

export function SupportTab({ tickets, onExport, onUpdateTicket, onDeleteTicket }: SupportTabProps) {
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setReplyDrafts(Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket.admin_reply || ''])));
  }, [tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Support, Feedback & Store Reports</h1>
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{ticket.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {ticket.store_name || '-'} • {ticket.owner_name || '-'} ({ticket.owner_email || '-'})
                </p>
                {ticket.type === 'store_report' ? (
                  <p className="text-sm text-muted-foreground">
                    Reporter: {ticket.reporter_name || '-'} ({ticket.reporter_email || '-'}) {ticket.reporter_phone ? `• ${ticket.reporter_phone}` : ''}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  Type: {ticket.type} • Priority: {ticket.priority} • Status: {ticket.status}
                </p>
              </div>
              <Button variant="outline" className="text-red-600" onClick={() => onDeleteTicket(ticket.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>

            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {ticket.type === 'store_report' ? 'Reporter Message' : 'Owner Message'}
              </p>
              <p className="whitespace-pre-wrap">{ticket.message}</p>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={ticket.status}
                onChange={(event) => void onUpdateTicket(ticket.id, { status: event.target.value as SupportTicket['status'] })}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={ticket.priority}
                onChange={(event) => void onUpdateTicket(ticket.id, { priority: event.target.value as SupportTicket['priority'] })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Button variant="outline" onClick={() => void onUpdateTicket(ticket.id, { status: 'in_progress' })}>
                <MessageSquare className="mr-2 h-4 w-4" /> Mark In Progress
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Reply</p>
              <textarea
                value={replyDrafts[ticket.id] ?? ''}
                onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: event.target.value }))}
                placeholder="Write response for store owner..."
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <div>
                <Button variant="outline" onClick={() => void onUpdateTicket(ticket.id, { admin_reply: replyDrafts[ticket.id] || '' })}>
                  Save Reply
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!tickets.length && <p className="text-sm text-muted-foreground">No support tickets yet.</p>}
      </div>
    </div>
  );
}
