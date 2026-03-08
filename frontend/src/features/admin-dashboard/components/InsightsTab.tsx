import { Card } from '@/src/components/ui';
import { formatPHP } from '@/src/lib/currency';
import type { AdminDashboardData, FraudAnalytics } from '@/src/types/domain';

interface InsightsTabProps {
  stores: AdminDashboardData | null;
  analytics: FraudAnalytics;
}

export function InsightsTab({ stores, analytics }: InsightsTabProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Insights</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Stores</p>
          <p className="text-2xl font-bold">{stores?.allStores.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold">{formatPHP(stores?.systemSummary?.totalIncome || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Assets Value</p>
          <p className="text-2xl font-bold">{formatPHP(stores?.systemSummary?.totalAssetsValue || 0)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-bold">Store Income/Assets/Customers</h3>
        <div className="space-y-3">
          {(stores?.storeInsights || [])
            .slice()
            .sort((a, b) => b.income - a.income)
            .slice(0, 8)
            .map((entry) => (
              <div key={entry.store_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{entry.store_name}</span>
                  <span className="font-semibold">{formatPHP(entry.income)}</span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-primary"
                    style={{ width: `${Math.min(100, (entry.income / Math.max(1, (stores?.storeInsights || [])[0]?.income || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Assets: {formatPHP(entry.assets_value)} ({entry.assets_count} units) • Customers: {entry.customers_count}
                </p>
              </div>
            ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-bold">Top Stores by Income</h3>
        <div className="space-y-3">
          {(stores?.storeInsights || [])
            .slice()
            .sort((a, b) => b.income - a.income)
            .slice(0, 10)
            .map((entry) => (
              <div key={entry.store_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{entry.store_name}</span>
                  <span className="font-bold">{formatPHP(entry.income)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (entry.income / Math.max(1, (stores?.storeInsights || [])[0]?.income || 1)) * 100)}%` }} />
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
