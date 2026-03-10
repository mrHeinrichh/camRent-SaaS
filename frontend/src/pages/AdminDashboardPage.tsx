import { useEffect, useMemo, useState } from 'react';
import { api } from '@/src/lib/api';
import { exportRowsToCsv } from '@/src/lib/export';
import type { AdminDashboardData, Announcement, AnnouncementSettings, DonationSettings, FraudAnalytics, FraudListEntry, SiteContent, SupportTicket } from '@/src/types/domain';
import type { AdminTab, EditFraudForm } from '@/src/features/admin-dashboard/types';
import { AdminSidebar } from '@/src/features/admin-dashboard/components/AdminSidebar';
import { StoresTab } from '@/src/features/admin-dashboard/components/StoresTab';
import { CustomersTab } from '@/src/features/admin-dashboard/components/CustomersTab';
import { FraudTab } from '@/src/features/admin-dashboard/components/FraudTab';
import { InsightsTab } from '@/src/features/admin-dashboard/components/InsightsTab';
import { EditFraudModal } from '@/src/features/admin-dashboard/components/EditFraudModal';
import { SupportTab } from '@/src/features/admin-dashboard/components/SupportTab';
import { AnnouncementsTab } from '@/src/features/admin-dashboard/components/AnnouncementsTab';
import { DonationsTab } from '@/src/features/admin-dashboard/components/DonationsTab';
import { SiteContentTab } from '@/src/features/admin-dashboard/components/SiteContentTab';
import { defaultSiteContent } from '@/src/config/siteContentDefaults';

const defaultEditFraudForm: EditFraudForm = {
  full_name: '',
  email: '',
  contact_number: '',
  scope: 'internal',
  status: 'approved',
  reason: '',
  evidence_image_url: '',
  requirement_files_text: '',
};

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stores');
  const [stores, setStores] = useState<AdminDashboardData | null>(null);
  const [fraudList, setFraudList] = useState<FraudListEntry[]>([]);
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [donationSaving, setDonationSaving] = useState(false);
  const [donationForm, setDonationForm] = useState<{
    message: string;
    is_active: boolean;
    qr_codes: Array<{ label: string; url: string; file: File | null }>;
    bank_details: Array<{ label: string; url: string; file: File | null }>;
  }>({
    message: '',
    is_active: true,
    qr_codes: [],
    bank_details: [],
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSettings>({ is_enabled: true });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<{
    title: string;
    description: string;
    image_url: string;
    cta_label: string;
    cta_url: string;
    is_active: boolean;
    sort_order: string;
    imageFile: File | null;
  }>({
    title: '',
    description: '',
    image_url: '',
    cta_label: '',
    cta_url: '',
    is_active: true,
    sort_order: '0',
    imageFile: null,
  });
  const [fraudSearch, setFraudSearch] = useState('');
  const [editingFraudId, setEditingFraudId] = useState<string | null>(null);
  const [savingFraud, setSavingFraud] = useState(false);
  const [editFraudForm, setEditFraudForm] = useState<EditFraudForm>(defaultEditFraudForm);
  const [globalFraudForm, setGlobalFraudForm] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    requirement_files_text: '',
    reason: '',
    evidence_image_url: '',
  });
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent as any);
  const [siteContentSaving, setSiteContentSaving] = useState(false);
  const [siteContentStatus, setSiteContentStatus] = useState<{ message: string; tone: 'success' | 'error' | 'neutral' } | null>(null);
  const [siteContentForm, setSiteContentForm] = useState({
    homeBadge: defaultSiteContent.home.badge,
    homeTitle: defaultSiteContent.home.title,
    homeSubtitle: defaultSiteContent.home.subtitle,
    policySections: defaultSiteContent.policies.sections.map((section) => ({ ...section })),
    faqText: defaultSiteContent.policies.faq_items.map((item) => `${item.q} || ${item.a}`).join('\n'),
    rentalGuideText: defaultSiteContent.policies.rental_guide_items.join('\n'),
    footerAboutText: defaultSiteContent.footer.about_text,
    footerAboutLinksText: defaultSiteContent.footer.about_links.map((link) => `${link.label}|${link.page || ''}`).join('\n'),
    footerPolicyLinksText: defaultSiteContent.footer.policy_links.map((link) => `${link.label}|${link.page || ''}`).join('\n'),
    footerUsefulLinksText: defaultSiteContent.footer.useful_links.map((link) => `${link.label}|${link.page || ''}${link.requires_login ? '|login' : ''}`).join('\n'),
    footerSocialLinksText: defaultSiteContent.footer.social_links.map((link) => `${link.label}|${link.url}`).join('\n'),
  });

  const loadData = async () => {
    const [storesData, list, analyticsData, supportData, announcementData, donationData, announcementSettingsData, siteContentData] = await Promise.all([
      api.get<AdminDashboardData>('/api/dashboard/admin'),
      api.get<FraudListEntry[]>('/api/admin/fraud-list'),
      api.get<FraudAnalytics>('/api/admin/fraud-analytics'),
      api.get<SupportTicket[]>('/api/admin/support-tickets'),
      api.get<Announcement[]>('/api/admin/announcements'),
      api.get<DonationSettings>('/api/admin/donation-settings'),
      api.get<AnnouncementSettings>('/api/admin/announcement-settings'),
      api.get<SiteContent>('/api/admin/site-content'),
    ]);
    setStores(storesData);
    setFraudList(list);
    setAnalytics(analyticsData);
    setSupportTickets(supportData);
    setAnnouncements(announcementData);
    setAnnouncementSettings({ is_enabled: announcementSettingsData?.is_enabled !== false, id: announcementSettingsData?.id ?? null });
    const resolvedContent = siteContentData || (defaultSiteContent as any);
    setSiteContent(resolvedContent);
    setSiteContentForm({
      homeBadge: resolvedContent.home?.badge || defaultSiteContent.home.badge,
      homeTitle: resolvedContent.home?.title || defaultSiteContent.home.title,
      homeSubtitle: resolvedContent.home?.subtitle || defaultSiteContent.home.subtitle,
      policySections: (resolvedContent.policies?.sections?.length ? resolvedContent.policies.sections : defaultSiteContent.policies.sections).map((section: any) => ({
        title: section.title || '',
        body: section.body || '',
      })),
      faqText: (resolvedContent.policies?.faq_items?.length ? resolvedContent.policies.faq_items : defaultSiteContent.policies.faq_items)
        .map((item: any) => `${item.q} || ${item.a}`)
        .join('\n'),
      rentalGuideText: (resolvedContent.policies?.rental_guide_items?.length ? resolvedContent.policies.rental_guide_items : defaultSiteContent.policies.rental_guide_items).join('\n'),
      footerAboutText: resolvedContent.footer?.about_text || defaultSiteContent.footer.about_text,
      footerAboutLinksText: (resolvedContent.footer?.about_links?.length ? resolvedContent.footer.about_links : defaultSiteContent.footer.about_links)
        .map((link: any) => `${link.label}|${link.page || link.url || ''}`)
        .join('\n'),
      footerPolicyLinksText: (resolvedContent.footer?.policy_links?.length ? resolvedContent.footer.policy_links : defaultSiteContent.footer.policy_links)
        .map((link: any) => `${link.label}|${link.page || link.url || ''}`)
        .join('\n'),
      footerUsefulLinksText: (resolvedContent.footer?.useful_links?.length ? resolvedContent.footer.useful_links : defaultSiteContent.footer.useful_links)
        .map((link: any) => `${link.label}|${link.page || link.url || ''}${link.requires_login ? '|login' : ''}`)
        .join('\n'),
      footerSocialLinksText: (resolvedContent.footer?.social_links?.length ? resolvedContent.footer.social_links : defaultSiteContent.footer.social_links)
        .map((link: any) => `${link.label}|${link.url || ''}`)
        .join('\n'),
    });
    setDonationForm({
      message: donationData?.message || '',
      is_active: donationData?.is_active !== false,
      qr_codes: (donationData?.qr_codes || []).map((entry) => ({ label: entry.label || '', url: entry.url || '', file: null })),
      bank_details: (donationData?.bank_details || []).map((entry) => ({ label: entry.label || '', url: entry.url || '', file: null })),
    });
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredFraudList = useMemo(
    () =>
      fraudList.filter((entry) => {
        const haystack = `${entry.full_name} ${entry.email} ${entry.contact_number} ${entry.reason} ${entry.scope || ''} ${entry.status || ''}`.toLowerCase();
        return haystack.includes(fraudSearch.trim().toLowerCase());
      }),
    [fraudList, fraudSearch],
  );

  const handleApproveStore = async (id: string) => {
    await api.post(`/api/admin/stores/${id}/approve`);
    await loadData();
  };

  const handleToggleStoreActive = async (id: string, isActive: boolean) => {
    await api.post(`/api/admin/stores/${id}/active`, { isActive });
    await loadData();
  };

  const handleToggleCustomerActive = async (id: string, isActive: boolean) => {
    await api.post(`/api/admin/customers/${id}/active`, { isActive });
    await loadData();
  };

  const promptAdminPassword = () => {
    const password = prompt('Enter your admin password to continue this delete action:');
    if (!password || !password.trim()) return null;
    return password.trim();
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('Delete this store and all its related data? This cannot be undone.')) return;
    const adminPassword = promptAdminPassword();
    if (!adminPassword) return;
    await api.post(`/api/admin/stores/${id}/delete`, { admin_password: adminPassword });
    await loadData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Delete this user and related data? This cannot be undone.')) return;
    const adminPassword = promptAdminPassword();
    if (!adminPassword) return;
    await api.post(`/api/admin/users/${id}/delete`, { admin_password: adminPassword });
    await loadData();
  };

  const handleCreateGlobalFraud = async () => {
    if (!globalFraudForm.full_name.trim() || !globalFraudForm.email.trim() || !globalFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    await api.post('/api/admin/fraud-list', {
      ...globalFraudForm,
      requirement_files: globalFraudForm.requirement_files_text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [typePart, ...urlParts] = line.split('|');
          const maybeUrl = (urlParts.length ? urlParts.join('|') : typePart).trim();
          const maybeType = (urlParts.length ? typePart : `ATTACHMENT_${index + 1}`).trim();
          return { type: maybeType || `ATTACHMENT_${index + 1}`, url: maybeUrl };
        })
        .filter((entry) => entry.url),
    });
    setGlobalFraudForm({
      full_name: '',
      email: '',
      contact_number: '',
      requirement_files_text: '',
      reason: '',
      evidence_image_url: '',
    });
    await loadData();
  };

  const handleEditFraud = (entry: FraudListEntry) => {
    setEditingFraudId(entry.id);
    setEditFraudForm({
      full_name: entry.full_name || '',
      email: entry.email || '',
      contact_number: entry.contact_number || '',
      scope: entry.scope === 'global' ? 'global' : 'internal',
      status: entry.status === 'pending' ? 'pending' : 'approved',
      reason: entry.reason || '',
      evidence_image_url: entry.evidence_image_url || '',
      requirement_files_text: (entry.requirement_files || [])
        .map((file) => `${file.type || 'ATTACHMENT'}|${file.url}`)
        .join('\n'),
    });
  };

  const handleSaveFraud = async () => {
    if (!editingFraudId) return;
    if (!editFraudForm.full_name.trim() || !editFraudForm.email.trim() || !editFraudForm.reason.trim()) {
      return alert('Full name, email, and reason are required');
    }
    try {
      setSavingFraud(true);
      await api.put(`/api/admin/fraud-list/${editingFraudId}`, {
        ...editFraudForm,
        requirement_files: editFraudForm.requirement_files_text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => {
            const [typePart, ...urlParts] = line.split('|');
            const maybeUrl = (urlParts.length ? urlParts.join('|') : typePart).trim();
            const maybeType = (urlParts.length ? typePart : `ATTACHMENT_${index + 1}`).trim();
            return { type: maybeType || `ATTACHMENT_${index + 1}`, url: maybeUrl };
          })
          .filter((entry) => entry.url),
      });
      setEditingFraudId(null);
      await loadData();
    } finally {
      setSavingFraud(false);
    }
  };

  const handleDeleteFraud = async (id: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    await api.delete(`/api/admin/fraud-list/${id}`);
    await loadData();
  };

  const handleApproveGlobal = async (id: string) => {
    await api.post(`/api/admin/fraud-list/${id}/approve-global`);
    await loadData();
  };

  const exportStoresExcel = () => {
    exportRowsToCsv(
      'superadmin_stores.csv',
      ['Store', 'Status', 'Active', 'Approved Date', 'Due Date', 'Due Days Remaining', 'Near Due', 'Overdue', 'Income', 'Assets Value', 'Assets Count', 'Customers', 'Avg Rating', 'Total Reviews'],
      (stores?.storeInsights || []).map((entry) => {
        const store = stores?.allStores.find((item) => item.id === entry.store_id);
        return [
          entry.store_name,
          store?.status || '',
          store?.is_active ? 'active' : 'inactive',
          store?.approved_at || '',
          store?.payment_due_date || '',
          entry.due_days_remaining ?? '',
          entry.near_due ? 'yes' : 'no',
          entry.overdue ? 'yes' : 'no',
          entry.income,
          entry.assets_value,
          entry.assets_count,
          entry.customers_count,
          Number(entry.average_rating || 0).toFixed(2),
          entry.total_reviews || 0,
        ];
      }),
    );
  };

  const exportFraudExcel = () => {
    exportRowsToCsv(
      'superadmin_fraud.csv',
      ['Name', 'Email', 'Phone', 'Scope', 'Status', 'Reason'],
      fraudList.map((entry) => [entry.full_name, entry.email, entry.contact_number, entry.scope || '', entry.status || '', entry.reason]),
    );
  };

  const exportCustomersExcel = () => {
    const insightByEmail = new Map((stores?.customerInsights || []).map((entry) => [String(entry.email || '').toLowerCase(), entry]));
    exportRowsToCsv(
      'superadmin_customers.csv',
      ['Name', 'Email', 'Active', 'Transactions', 'Successful', 'Total Spent', 'Last Transaction'],
      (stores?.customers || []).map((customer) => {
        const insight = insightByEmail.get(String(customer.email || '').toLowerCase());
        return [
          customer.full_name,
          customer.email,
          customer.is_active === false ? 'disabled' : 'active',
          insight?.transaction_count || 0,
          insight?.successful_transactions || 0,
          insight?.total_spent || 0,
          insight?.last_transaction_at || '',
        ];
      }),
    );
  };

  const exportSupportExcel = () => {
    exportRowsToCsv(
      'superadmin_support.csv',
      [
        'Store',
        'Owner',
        'Owner Email',
        'Type',
        'Subject',
        'Status',
        'Priority',
        'Reporter Name',
        'Reporter Email',
        'Reporter Phone',
        'Created At',
        'Updated At',
      ],
      supportTickets.map((ticket) => [
        ticket.store_name || '',
        ticket.owner_name || '',
        ticket.owner_email || '',
        ticket.type,
        ticket.subject,
        ticket.status,
        ticket.priority,
        ticket.reporter_name || '',
        ticket.reporter_email || '',
        ticket.reporter_phone || '',
        ticket.created_at,
        ticket.updated_at,
      ]),
    );
  };

  const handleUpdateSupportTicket = async (
    id: string,
    payload: { status?: SupportTicket['status']; priority?: SupportTicket['priority']; admin_reply?: string },
  ) => {
    await api.put(`/api/admin/support-tickets/${id}`, payload);
    await loadData();
  };

  const handleDeleteSupportTicket = async (id: string) => {
    if (!confirm('Delete this support ticket?')) return;
    await api.delete(`/api/admin/support-tickets/${id}`);
    await loadData();
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setAnnouncementForm({
      title: announcement.title || '',
      description: announcement.description || '',
      image_url: announcement.image_url || '',
      cta_label: announcement.cta_label || '',
      cta_url: announcement.cta_url || '',
      is_active: announcement.is_active !== false,
      sort_order: String(announcement.sort_order ?? 0),
      imageFile: null,
    });
  };

  const handleSubmitAnnouncement = async () => {
    if (!announcementForm.title.trim() && !announcementForm.description.trim() && !announcementForm.image_url.trim() && !announcementForm.imageFile) {
      return alert('Add at least text (title/description) or image');
    }
    try {
      setAnnouncementSaving(true);
      let nextImageUrl = announcementForm.image_url.trim();
      if (announcementForm.imageFile) {
        const form = new FormData();
        form.append('file', announcementForm.imageFile);
        const upload = await api.post<{ url: string }>('/api/upload/public', form);
        nextImageUrl = upload.url;
      }
      const payload = {
        title: announcementForm.title.trim(),
        description: announcementForm.description.trim(),
        image_url: nextImageUrl,
        cta_label: announcementForm.cta_label.trim(),
        cta_url: announcementForm.cta_url.trim(),
        is_active: announcementForm.is_active,
        sort_order: Number(announcementForm.sort_order || 0),
      };
      if (editingAnnouncementId) {
        await api.put(`/api/admin/announcements/${editingAnnouncementId}`, payload);
      } else {
        await api.post('/api/admin/announcements', payload);
      }
      setEditingAnnouncementId(null);
      setAnnouncementForm({
        title: '',
        description: '',
        image_url: '',
        cta_label: '',
        cta_url: '',
        is_active: true,
        sort_order: '0',
        imageFile: null,
      });
      await loadData();
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/api/admin/announcements/${id}`);
    await loadData();
  };

  const handleToggleAnnouncement = async (id: string, nextValue: boolean) => {
    await api.put(`/api/admin/announcements/${id}`, { is_active: nextValue });
    await loadData();
  };

  const handleToggleAnnouncementGlobal = async (nextValue: boolean) => {
    await api.put('/api/admin/announcement-settings', { is_enabled: nextValue });
    await loadData();
  };

  const parseLinks = (value: string, withLoginFlag: boolean) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, target, loginFlag] = line.split('|').map((part) => (part || '').trim());
        const isUrl = target.startsWith('http');
        return {
          label,
          page: isUrl ? '' : target,
          url: isUrl ? target : '',
          requires_login: withLoginFlag ? String(loginFlag || '').toLowerCase() === 'login' || String(loginFlag || '').toLowerCase() === 'true' : false,
        };
      })
      .filter((entry) => entry.label && (entry.page || entry.url));

  const handleSaveSiteContent = async () => {
    try {
      setSiteContentSaving(true);
      setSiteContentStatus({ message: 'Saving...', tone: 'neutral' });
      const payload: SiteContent = {
        home: {
          badge: siteContentForm.homeBadge.trim(),
          title: siteContentForm.homeTitle.trim(),
          subtitle: siteContentForm.homeSubtitle.trim(),
        },
        policies: {
          sections: siteContentForm.policySections.map((section) => ({
            title: String(section.title || '').trim(),
            body: String(section.body || '').trim(),
          })),
          faq_items: siteContentForm.faqText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [q, a] = line.split('||').map((value) => (value || '').trim());
              return { q, a };
            })
            .filter((item) => item.q || item.a),
          rental_guide_items: siteContentForm.rentalGuideText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        },
        footer: {
          about_text: siteContentForm.footerAboutText.trim(),
          about_links: parseLinks(siteContentForm.footerAboutLinksText, false),
          policy_links: parseLinks(siteContentForm.footerPolicyLinksText, false),
          useful_links: parseLinks(siteContentForm.footerUsefulLinksText, true),
          social_links: siteContentForm.footerSocialLinksText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [label, url] = line.split('|').map((value) => (value || '').trim());
              return { label, url };
            })
            .filter((entry) => entry.label && entry.url),
        },
      };
      await api.put('/api/admin/site-content', payload);
      await loadData();
      setSiteContentStatus({ message: 'Site content saved.', tone: 'success' });
    } catch (error: any) {
      setSiteContentStatus({ message: error?.message || 'Failed to save site content.', tone: 'error' });
    } finally {
      setSiteContentSaving(false);
    }
  };

  const handleSaveDonationSettings = async () => {
    try {
      setDonationSaving(true);
      const qrCodes = await Promise.all(
        donationForm.qr_codes.map(async (entry) => {
          if (entry.file) {
            const form = new FormData();
            form.append('file', entry.file);
            const upload = await api.post<{ url: string }>('/api/upload/public', form);
            return { label: entry.label.trim(), url: upload.url };
          }
          return { label: entry.label.trim(), url: entry.url.trim() };
        }),
      );
      const bankDetails = await Promise.all(
        donationForm.bank_details.map(async (entry) => {
          if (entry.file) {
            const form = new FormData();
            form.append('file', entry.file);
            const upload = await api.post<{ url: string }>('/api/upload/public', form);
            return { label: entry.label.trim(), url: upload.url };
          }
          return { label: entry.label.trim(), url: entry.url.trim() };
        }),
      );
      await api.put('/api/admin/donation-settings', {
        message: donationForm.message.trim(),
        is_active: donationForm.is_active,
        qr_codes: qrCodes.filter((entry) => entry.url),
        bank_details: bankDetails.filter((entry) => entry.label || entry.url),
      });
      await loadData();
      alert('Donation settings updated');
    } finally {
      setDonationSaving(false);
    }
  };

  const exportAnnouncementsExcel = () => {
    exportRowsToCsv(
      'superadmin_announcements.csv',
      ['Title', 'Description', 'Image URL', 'CTA Label', 'CTA URL', 'Active', 'Sort Order', 'Updated'],
      announcements.map((entry) => [
        entry.title,
        entry.description || '',
        entry.image_url || '',
        entry.cta_label || '',
        entry.cta_url || '',
        entry.is_active ? 'yes' : 'no',
        entry.sort_order,
        entry.updated_at,
      ]),
    );
  };

  const exportDonationsExcel = () => {
    exportRowsToCsv(
      'superadmin_donations.csv',
      ['Message', 'Active', 'QR Label', 'QR URL', 'Bank Label', 'Bank Image URL'],
      [
        ...donationForm.qr_codes.map((entry) => [donationForm.message, donationForm.is_active ? 'yes' : 'no', entry.label, entry.url, '', '']),
        ...donationForm.bank_details.map((entry) => [donationForm.message, donationForm.is_active ? 'yes' : 'no', '', '', entry.label, entry.url]),
      ],
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row">
      <AdminSidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        pendingMerchants={stores?.systemSummary?.pendingMerchants || stores?.pendingStores?.length || 0}
        nearDueStores={stores?.systemSummary?.nearDueStores || 0}
        pendingGlobalFraud={stores?.systemSummary?.pendingGlobalFraud || 0}
        feedbackCount={stores?.systemSummary?.totalFeedback || 0}
      />
      <main className="flex-1 overflow-auto p-4 md:p-8">
        {activeTab === 'stores' && stores && (
          <StoresTab
            stores={stores}
            onExport={exportStoresExcel}
            onApproveStore={handleApproveStore}
            onToggleStoreActive={handleToggleStoreActive}
            onDeleteStore={handleDeleteStore}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'customers' && stores && (
          <CustomersTab
            customers={stores.customers || []}
            customerInsights={stores.customerInsights || []}
            onExport={exportCustomersExcel}
            onToggleCustomerActive={handleToggleCustomerActive}
            onDeleteCustomer={handleDeleteUser}
          />
        )}

        {activeTab === 'fraud' && (
          <FraudTab
            fraudList={filteredFraudList}
            fraudSearch={fraudSearch}
            onFraudSearchChange={setFraudSearch}
            globalFraudForm={globalFraudForm}
            onGlobalFraudFormChange={setGlobalFraudForm}
            onCreateGlobalFraud={handleCreateGlobalFraud}
            onEdit={handleEditFraud}
            onApproveGlobal={handleApproveGlobal}
            onDelete={handleDeleteFraud}
            onExport={exportFraudExcel}
          />
        )}

        {activeTab === 'insights' && analytics && <InsightsTab stores={stores} analytics={analytics} />}

        {activeTab === 'support' && (
          <SupportTab tickets={supportTickets} onExport={exportSupportExcel} onUpdateTicket={handleUpdateSupportTicket} onDeleteTicket={handleDeleteSupportTicket} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTab
            announcements={announcements}
            globalEnabled={announcementSettings.is_enabled !== false}
            form={announcementForm}
            editingId={editingAnnouncementId}
            saving={announcementSaving}
            onFormChange={(next) => setAnnouncementForm((prev) => ({ ...prev, ...next }))}
            onSubmit={handleSubmitAnnouncement}
            onEdit={handleEditAnnouncement}
            onDelete={handleDeleteAnnouncement}
            onToggleActive={handleToggleAnnouncement}
            onToggleGlobal={handleToggleAnnouncementGlobal}
            onExport={exportAnnouncementsExcel}
          />
        )}

        {activeTab === 'donations' && (
          <DonationsTab
            form={donationForm}
            saving={donationSaving}
            onChange={(next) => setDonationForm((prev) => ({ ...prev, ...next }))}
            onSave={handleSaveDonationSettings}
            onExport={exportDonationsExcel}
          />
        )}

        {activeTab === 'content' && (
          <SiteContentTab
            form={siteContentForm}
            saving={siteContentSaving}
            statusMessage={siteContentStatus?.message}
            statusTone={siteContentStatus?.tone}
            onChange={(next) => setSiteContentForm((prev) => ({ ...prev, ...next }))}
            onSave={handleSaveSiteContent}
          />
        )}
      </main>

      <EditFraudModal
        open={Boolean(editingFraudId)}
        form={editFraudForm}
        saving={savingFraud}
        onChange={setEditFraudForm}
        onCancel={() => {
          setEditingFraudId(null);
          setSavingFraud(false);
          setEditFraudForm(defaultEditFraudForm);
        }}
        onSave={handleSaveFraud}
      />
    </div>
  );
}
