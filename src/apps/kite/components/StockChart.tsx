import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ColorType } from "lightweight-charts";
import { QuoteData, StructureType, SubStrategyType, WindType } from "../types";
import { StrategyChecklist } from "./StrategyChecklist";
import { XIcon } from "../../../components/Icons";
import "./StockChart.css";

const API_BASE = "/api/kite";

interface MACDData {
    macd: number[];
    signal: number[];
    histogram: number[];
}

interface ChartData {
    symbol: string;
    candles: {
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }[];
    ma5: number[];
    ma20: number[];
    ma60: number[];
    macd: MACDData;
}

interface StockChartProps {
    symbol: string;
    quote?: QuoteData | null;
    structure?: StructureType;
    currentSubStrategy?: SubStrategyType;
    currentWind?: WindType | null;
    revenueYoyChecked?: boolean;
    onClose?: () => void;
}

type Timeframe = "D" | "W" | "M";

export function StockChart({
    symbol,
    quote,
    structure,
    currentSubStrategy,
    currentWind,
    revenueYoyChecked = false,
    onClose
}: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);
    const isSyncingRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ChartData | null>(null);
    const [timeframe, setTimeframe] = useState<Timeframe>("D");

    // Fetch chart data
    useEffect(() => {
        if (!symbol) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/chart?symbol=${symbol}&timeframe=${timeframe}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to fetch chart data");
                }
                const chartData: ChartData = await res.json();

                // Validate data
                if (!chartData.candles || chartData.candles.length === 0) {
                    throw new Error("No candlestick data available");
                }

                setData(chartData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load chart");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol, timeframe]);

    // Create and update charts
    useEffect(() => {
        if (!chartContainerRef.current || !macdContainerRef.current || !data || data.candles.length === 0) return;

        // Clean up previous charts
        if (chartRef.current) {
            chartRef.current.remove();
        }
        if (macdChartRef.current) {
            macdChartRef.current.remove();
        }

        // Create main price chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#d1d4dc",
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.05)" },
                horzLines: { color: "rgba(255, 255, 255, 0.05)" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 280,
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
            },
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                timeVisible: true,
            },
            crosshair: {
                mode: 1, // Magnet mode
                vertLine: {
                    width: 1,
                    color: "rgba(255, 255, 255, 0.3)",
                    style: 3, // Dashed
                    labelBackgroundColor: "#2c2f36",
                },
                horzLine: {
                    color: "rgba(255, 255, 255, 0.3)",
                    labelBackgroundColor: "#2c2f36",
                },
            },
        });

        // Create MACD sub-chart
        const macdChart = createChart(macdContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#d1d4dc",
            },
            grid: {
                vertLines: { color: "rgba(255, 255, 255, 0.05)" },
                horzLines: { color: "rgba(255, 255, 255, 0.05)" },
            },
            width: macdContainerRef.current.clientWidth,
            height: 100, // Reduced height for sub-chart
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                visible: true,
                borderColor: "rgba(255, 255, 255, 0.1)",
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    width: 1,
                    color: "rgba(255, 255, 255, 0.3)",
                    style: 3,
                    labelBackgroundColor: "#2c2f36",
                },
                horzLine: {
                    color: "rgba(255, 255, 255, 0.3)",
                    labelBackgroundColor: "#2c2f36",
                },
            },
        });

        chartRef.current = chart;
        macdChartRef.current = macdChart;

        // Sync time scales (prevent feedback loop)
        const syncToMacd = (range: { from: number; to: number } | null) => {
            if (isSyncingRef.current || !range) return;
            isSyncingRef.current = true;
            macdChart.timeScale().setVisibleLogicalRange(range);
            isSyncingRef.current = false;
        };

        const syncToMain = (range: { from: number; to: number } | null) => {
            if (isSyncingRef.current || !range) return;
            isSyncingRef.current = true;
            chart.timeScale().setVisibleLogicalRange(range);
            isSyncingRef.current = false;
        };

        chart.timeScale().subscribeVisibleLogicalRangeChange(syncToMacd);
        macdChart.timeScale().subscribeVisibleLogicalRangeChange(syncToMain);

        // Add candlestick series
        const candleSeries = chart.addCandlestickSeries({
            upColor: "#ef4444",
            downColor: "#22c55e",
            borderUpColor: "#ef4444",
            borderDownColor: "#22c55e",
            wickUpColor: "#ef4444",
            wickDownColor: "#22c55e",
        });

        // Add MA lines
        const ma5Series = chart.addLineSeries({
            color: "#fbbf24",
            lineWidth: 1,
        });

        const ma20Series = chart.addLineSeries({
            color: "#3b82f6",
            lineWidth: 1,
        });

        const ma60Series = chart.addLineSeries({
            color: "#a855f7",
            lineWidth: 1,
        });

        // Add MACD series
        const macdLineSeries = macdChart.addLineSeries({
            color: "#3B82F6", // Blue
            lineWidth: 1,
        });

        const signalLineSeries = macdChart.addLineSeries({
            color: "#f59e0b", // Orange
            lineWidth: 1,
        });

        const histogramSeries = macdChart.addHistogramSeries({
            color: "#26a69a",
        });

        // Set data
        const candleData = data.candles.map(c => ({
            time: c.date,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));

        const ma5Data = data.candles
            .map((c, i) => ({
                time: c.date as string,
                value: data.ma5[i],
            }))
            .filter((d) => d.value > 0);

        const ma20Data = data.candles
            .map((c, i) => ({
                time: c.date as string,
                value: data.ma20[i],
            }))
            .filter((d) => d.value > 0);

        const ma60Data = data.candles
            .map((c, i) => ({
                time: c.date as string,
                value: data.ma60[i],
            }))
            .filter((d) => d.value > 0);

        // Transform MACD data - keep ALL data points to match candles exactly
        // Don't filter - let zeros display as flat lines at 0
        const macdLineData = data.candles.map((c, i) => ({
            time: c.date as string,
            value: data.macd.macd[i] || 0,
        }));

        const signalData = data.candles.map((c, i) => ({
            time: c.date as string,
            value: data.macd.signal[i] || 0,
        }));

        const histogramData = data.candles.map((c, i) => ({
            time: c.date as string,
            value: data.macd.histogram[i] || 0,
            color: (data.macd.histogram[i] || 0) >= 0 ? "#26a69a" : "#ef5350",
        }));

        // Set all data
        candleSeries.setData(candleData);
        ma5Series.setData(ma5Data);
        ma20Series.setData(ma20Data);
        ma60Series.setData(ma60Data);

        macdLineSeries.setData(macdLineData);
        signalLineSeries.setData(signalData);
        histogramSeries.setData(histogramData);

        // Only fit main chart, then sync MACD to it
        chart.timeScale().fitContent();

        // Force MACD to match main chart's time range
        const syncRange = () => {
            const range = chart.timeScale().getVisibleLogicalRange();
            if (range) {
                macdChart.timeScale().setVisibleLogicalRange(range);
            }
        };

        // Sync immediately and after a delay for reliable initialization
        syncRange();
        setTimeout(syncRange, 50);
        setTimeout(syncRange, 200);

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && macdContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                macdChart.applyOptions({ width: macdContainerRef.current.clientWidth });
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.timeScale().unsubscribeVisibleLogicalRangeChange(syncToMacd);
            macdChart.timeScale().unsubscribeVisibleLogicalRangeChange(syncToMain);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
            if (macdChartRef.current) {
                macdChartRef.current.remove();
                macdChartRef.current = null;
            }
        };
    }, [data]);

    return (
        <div className="stock-chart-modal" onClick={onClose}>
            <div className="stock-chart-backdrop" />
            <div className="stock-chart-container" onClick={(e) => e.stopPropagation()}>
                <div className="chart-header">
                    <div className="chart-title">
                        <h3>{symbol} K線圖</h3>
                        <div className="timeframe-tabs">
                            <button
                                className={`tf-tab ${timeframe === "D" ? "active" : ""}`}
                                onClick={() => setTimeframe("D")}
                            >
                                日 K
                            </button>
                            <button
                                className={`tf-tab ${timeframe === "W" ? "active" : ""}`}
                                onClick={() => setTimeframe("W")}
                            >
                                週 K
                            </button>
                            <button
                                className={`tf-tab ${timeframe === "M" ? "active" : ""}`}
                                onClick={() => setTimeframe("M")}
                            >
                                月 K
                            </button>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <XIcon size={24} />
                    </button>
                </div>

                <div className="chart-content-row">
                    <div className="chart-main-col">
                        <div className="chart-legend">
                            <div className="legend-item ma5">MA5</div>
                            <div className="legend-item ma20">MA20</div>
                            <div className="legend-item ma60">MA60</div>
                        </div>

                        {loading ? (
                            <div className="chart-loading">載入中 Loading...</div>
                        ) : error ? (
                            <div className="chart-error">{error}</div>
                        ) : (
                            <>
                                <div className="chart-area" ref={chartContainerRef} />
                                <div className="macd-legend">
                                    <div className="legend-item macd" style={{ color: '#3B82F6' }}>● MACD</div>
                                    <div className="legend-item signal" style={{ color: '#f59e0b' }}>● Signal</div>
                                    <div className="legend-item histogram" style={{ color: '#26a69a' }}>■ Histogram</div>
                                </div>
                                <div className="macd-chart-area" ref={macdContainerRef} />
                            </>
                        )}
                    </div>

                    {/* Right side checklist */}
                    {quote && structure && currentSubStrategy && (
                        <div className="chart-sidebar">
                            <StrategyChecklist
                                quote={quote}
                                structure={structure}
                                subStrategy={currentSubStrategy}
                                currentWind={currentWind || null}
                                revenueYoyChecked={revenueYoyChecked}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
