import type { Router } from 'express';
import { authenticate, checkRole } from '../../middleware/auth';
import { Store } from '../../models/Store';
import { SupportTicket } from '../../models/SupportTicket';
import type { AuthedRequest } from '../../types/auth';
import { serialize, serializeMany, toId } from '../../utils/mongo';

const ownerTicketTypeValues = new Set(['feedback', 'support', 'bug']);
const ownerTicketStatusValues = new Set(['open', 'in_progress', 'resolved', 'closed']);
const ownerTicketPriorityValues = new Set(['low', 'medium', 'high']);

export function registerOwnerSupportRoutes(router: Router) {
  router.get('/owner/support-tickets', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
    if (!store) return res.status(404).json({ error: 'No store found for this owner account' });
    const tickets = await SupportTicket.find({ owner_id: toId(req.user!.id), store_id: store._id }).sort({ updated_at: -1 }).lean();
    res.json(serializeMany(tickets as any[]));
  });

  router.post('/owner/support-tickets', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const store = await Store.findOne({ owner_id: toId(req.user!.id) }).lean();
    if (!store) return res.status(404).json({ error: 'No store found for this owner account' });

    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    const type = String(req.body?.type || 'feedback').trim().toLowerCase();
    const priority = String(req.body?.priority || 'medium').trim().toLowerCase();

    if (!subject) return res.status(400).json({ error: 'Subject is required' });
    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (!ownerTicketTypeValues.has(type)) return res.status(400).json({ error: 'Invalid ticket type' });
    if (!ownerTicketPriorityValues.has(priority)) return res.status(400).json({ error: 'Invalid priority' });

    const ticket = await SupportTicket.create({
      store_id: store._id,
      owner_id: toId(req.user!.id),
      type,
      subject,
      message,
      priority,
      status: 'open',
      admin_reply: '',
      resolved_at: null,
    });

    res.json({ success: true, ticket: serialize(ticket as any) });
  });

  router.put('/owner/support-tickets/:id', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    const ticket = await SupportTicket.findOne({ _id: toId(req.params.id), owner_id: toId(req.user!.id) });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

    if (req.body?.subject !== undefined) {
      const nextSubject = String(req.body.subject || '').trim();
      if (!nextSubject) return res.status(400).json({ error: 'Subject is required' });
      ticket.subject = nextSubject;
    }
    if (req.body?.message !== undefined) {
      const nextMessage = String(req.body.message || '').trim();
      if (!nextMessage) return res.status(400).json({ error: 'Message is required' });
      ticket.message = nextMessage;
    }
    if (req.body?.type !== undefined) {
      const nextType = String(req.body.type || '').trim().toLowerCase();
      if (!ownerTicketTypeValues.has(nextType)) return res.status(400).json({ error: 'Invalid ticket type' });
      (ticket as any).type = nextType;
    }
    if (req.body?.priority !== undefined) {
      const nextPriority = String(req.body.priority || '').trim().toLowerCase();
      if (!ownerTicketPriorityValues.has(nextPriority)) return res.status(400).json({ error: 'Invalid priority' });
      (ticket as any).priority = nextPriority;
    }
    if (req.body?.status !== undefined) {
      const nextStatus = String(req.body.status || '').trim().toLowerCase();
      if (!ownerTicketStatusValues.has(nextStatus)) return res.status(400).json({ error: 'Invalid status' });
      if (nextStatus === 'closed') {
        (ticket as any).status = 'closed';
        (ticket as any).resolved_at = new Date();
      } else {
        return res.status(400).json({ error: 'Owner can only close ticket status directly' });
      }
    }

    await ticket.save();
    res.json({ success: true, ticket: serialize(ticket as any) });
  });

  router.delete('/owner/support-tickets/:id', authenticate, checkRole(['owner']), async (req: AuthedRequest, res) => {
    await SupportTicket.deleteOne({ _id: toId(req.params.id), owner_id: toId(req.user!.id) });
    res.json({ success: true });
  });
}
