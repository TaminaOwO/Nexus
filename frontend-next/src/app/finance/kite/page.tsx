export const dynamic = 'force-dynamic'

import { getMarketIndex, getMarketFutures, getStrategyStats, getStrategyOffice, getStrategyWorker, getStrategyBoss, getPortfolio, getStrategyDefinitions, getTokenStatus } from '@/lib/nexus-backend';
import TopBar from '@/components/TopBar';
import Sidebar from '@/components/Sidebar';
import KiteDashboard from '@/components/kite/KiteDashboard';
import TokenStatusPanel from '@/components/kite/TokenStatusPanel';

export default async function KitePage() {
  // Fetch all data server-side (uses NEXUS_API_KEY, no client exposure)
  const [indexData, futuresData, statsData, officeData, workerData, bossData, portfolioData, defsData, tokenStatusData] = await Promise.allSettled([
    getMarketIndex(),
    getMarketFutures(),
    getStrategyStats(),
    getStrategyOffice(),
    getStrategyWorker(),
    getStrategyBoss(),
    getPortfolio(),
    getStrategyDefinitions(),
    getTokenStatus(),
  ]);

  const safeValue = <T,>(result: PromiseSettledResult<{ data: T }>, fallback: T): T =>
    result.status === 'fulfilled' ? result.value.data : fallback;

  const props = {
    indices: safeValue(indexData, []),
    futures: safeValue(futuresData, null),
    stats: safeValue(statsData, []),
    officeStocks: safeValue(officeData, []),
    workerStocks: safeValue(workerData, []),
    bossStocks: safeValue(bossData, []),
    portfolio: safeValue(portfolioData, []),
    strategyDefinitions: safeValue(defsData, []),
  };

  const tokenStatus = tokenStatusData.status === 'fulfilled' ? tokenStatusData.value : null;

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar departmentName="Finance / Kite Dashboard" />
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <TokenStatusPanel tokenStatus={tokenStatus} />
          <KiteDashboard {...props} />
        </main>
      </div>
    </div>
  );
}
