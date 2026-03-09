import { Card } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { AdminDashboardData, FraudAnalytics } from '@/src/types/domain';

interface InsightsTabProps {
  stores: AdminDashboardData | null;
  analytics: FraudAnalytics;
}

export function InsightsTab({ stores, analytics }: InsightsTabProps) {
  const summary = stores?.systemSummary;
  const topStores = stores?.topStores || stores?.storeInsights || [];
  const topCustomers = stores?.topCustomers || [];
  const topGears = stores?.topGears || [];
  const recentRatings = stores?.recentRatings || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Insights</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Stores</p>
          <p className="text-2xl font-bold">{summary?.totalStores || stores?.allStores.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold">{formatPHP(summary?.totalIncome || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Assets Value</p>
          <p className="text-2xl font-bold">{formatPHP(summary?.totalAssetsValue || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Ratings</p>
          <p className="text-2xl font-bold">{summary?.totalRatings || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Merchants</p>
          <p className="text-2xl font-bold">{summary?.pendingMerchants || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Near Due Stores</p>
          <p className="text-2xl font-bold">{summary?.nearDueStores || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Overdue Stores</p>
          <p className="text-2xl font-bold">{summary?.overdueStores || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Feedback Tickets</p>
          <p className="text-2xl font-bold">{summary?.totalFeedback || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Global Fraud</p>
          <p className="text-2xl font-bold">{summary?.pendingGlobalFraud || 0}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-bold">Top Stores by Income</h3>
        <div className="space-y-3">
          {topStores.slice(0, 10).map((entry) => (
              <div key={entry.store_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{entry.store_name}</span>
                  <span className="font-semibold">{formatPHP(entry.income)}</span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${Math.min(100, (entry.income / Math.max(1, topStores[0]?.income || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Assets: {formatPHP(entry.assets_value)} ({entry.assets_count} units) • Customers: {entry.customers_count} • Rating:{' '}
                  {Number(entry.average_rating || 0).toFixed(1)} ({entry.total_reviews || 0})
                </p>
              </div>
            ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-bold">Top Customers</h3>
          <div className="space-y-3">
            {topCustomers.slice(0, 10).map((entry) => (
              <div key={entry.customer_id} className="rounded bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{entry.full_name}</span>
                  <span className="font-bold">{formatPHP(entry.total_spent)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{entry.email}</p>
                <p className="text-xs text-muted-foreground">
                  Transactions: {entry.transaction_count} • Successful: {entry.successful_transactions}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-bold">Top Gears</h3>
          <div className="space-y-3">
            {topGears.slice(0, 10).map((gear) => (
              <div key={gear.item_id} className="rounded bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{gear.name}</span>
                  <span className="font-bold">{gear.rent_count} rents</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {gear.brand} • {gear.category} • {gear.store_name}
                </p>
                <p className="text-xs text-muted-foreground">Revenue estimate: {formatPHP(gear.revenue_estimate)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-bold">Recent Store Ratings</h3>
        <div className="space-y-3">
          {recentRatings.slice(0, 12).map((entry) => (
            <div key={entry.id} className="rounded bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{entry.store_name || 'Store'}</span>
                <span className="font-bold">{entry.rating.toFixed(1)} / 5</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.renter_name} • {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
              </p>
              <p className="text-xs text-muted-foreground">{entry.description || 'No description'}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-bold">Store Income Distribution</h3>
        <div className="space-y-3">
          {topStores.slice(0, 10).map((entry) => (
              <div key={entry.store_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{entry.store_name}</span>
                  <span className="font-bold">{formatPHP(entry.income)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (entry.income / Math.max(1, topStores[0]?.income || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-bold">Most Reported Emails</h3>
          <div className="space-y-3">
            {analytics.mostReportedEmails.map((item) => (
              <div key={item.email} className="flex items-center justify-between rounded bg-muted/30 p-2">
                <span className="text-sm">{item.email}</span>
                <span className="font-bold">{item.count} reports</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-bold">Fraud Rate per Store</h3>
          <div className="space-y-3">
            {analytics.fraudRatePerStore.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-bold">{Math.round(item.fraud_rate)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${item.fraud_rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
