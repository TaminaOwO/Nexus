import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, ColorType, CandlestickSeries, LineSeries } from "lightweight-charts";
import "./StockChart.css";

const API_BASE = "/api/kite";

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
}

interface StockChartProps {
    symbol: string;
    onClose?: () => void;
}

export function StockChart({ symbol, onClose }: StockChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const ma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ma60SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ChartData | null>(null);

    // Fetch chart data
    useEffect(() => {
        if (!symbol) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/chart?symbol=${symbol}`);
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Failed to fetch chart data");
                }
                const chartData = await res.json();
                setData(chartData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load chart");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol]);

    // Create and update chart
    useEffect(() => {
        if (!chartContainerRef.current || !data) return;

        // Create chart
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
            height: 400,
            crosshair: {
                mode: 1,
            },
            rightPriceScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
            },
            timeScale: {
                borderColor: "rgba(255, 255, 255, 0.1)",
                timeVisible: true,
            },
        });

        chartRef.current = chart;

        // Add candlestick series (v5 API)
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#ef4444",
            downColor: "#22c55e",
            borderUpColor: "#ef4444",
            borderDownColor: "#22c55e",
            wickUpColor: "#ef4444",
            wickDownColor: "#22c55e",
        });
        candleSeriesRef.current = candleSeries;

        // Add MA lines (v5 API)
        const ma5Series = chart.addSeries(LineSeries, {
            color: "#fbbf24",
            lineWidth: 1,
        });
        ma5SeriesRef.current = ma5Series;

        const ma20Series = chart.addSeries(LineSeries, {
            color: "#3b82f6",
            lineWidth: 1,
        });
        ma20SeriesRef.current = ma20Series;

        const ma60Series = chart.addSeries(LineSeries, {
            color: "#a855f7",
            lineWidth: 1,
        });
        ma60SeriesRef.current = ma60Series;

        // Transform and set data
        const candleData: CandlestickData[] = data.candles.map((c) => ({
            time: c.date as CandlestickData["time"],
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
        }));

        const ma5Data: LineData[] = data.candles
            .map((c, i) => ({
                time: c.date as LineData["time"],
                value: data.ma5[i],
            }))
            .filter((d) => d.value > 0);

        const ma20Data: LineData[] = data.candles
            .map((c, i) => ({
                time: c.date as LineData["time"],
                value: data.ma20[i],
            }))
            .filter((d) => d.value > 0);

        const ma60Data: LineData[] = data.candles
            .map((c, i) => ({
                time: c.date as LineData["time"],
                value: data.ma60[i],
            }))
            .filter((d) => d.value > 0);

        candleSeries.setData(candleData);
        ma5Series.setData(ma5Data);
        ma20Series.setData(ma20Data);
        ma60Series.setData(ma60Data);

        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div className="stock-chart-modal">
            <div className="stock-chart-backdrop" onClick={onClose} />
            <div className="stock-chart-container">
                <div className="chart-header">
                    <h3>📈 {symbol} K線圖</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="chart-legend">
                    <span className="legend-item ma5">MA5</span>
                    <span className="legend-item ma20">MA20</span>
                    <span className="legend-item ma60">MA60</span>
                </div>

                {loading && (
                    <div className="chart-loading">
                        <span>載入中...</span>
                    </div>
                )}

                {error && (
                    <div className="chart-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <div
                    ref={chartContainerRef}
                    className="chart-area"
                    style={{ display: loading || error ? "none" : "block" }}
                />
            </div>
        </div>
    );
}
