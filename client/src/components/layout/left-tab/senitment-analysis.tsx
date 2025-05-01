import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { withFallback } from "@/libs/font-constant";

const DOCS_SENTIMENT = [
  { id: "paper-attention", label: "Attention Is All You Need", sentimentScore: 0.82 },
  {
    id: "paper-bert",
    label: "BERT: Pre-training of Deep Bidirectional Transformers",
    sentimentScore: 0.75,
  },
  {
    id: "paper-overfit",
    label: "Challenges of Overfitting in Deep Learning Models",
    sentimentScore: -0.42,
  },
  {
    id: "paper-failure",
    label: "When Neural Networks Fail: A Study of Catastrophic Forgetting",
    sentimentScore: -0.67,
  },
  {
    id: "paper-ethics",
    label: "The Dark Side of AI: Ethical Risks and Failures",
    sentimentScore: -0.58,
  },
  {
    id: "paper-bias",
    label: "Uncovering Bias in Language Models: A Critical Perspective",
    sentimentScore: -0.49,
  },
  {
    id: "paper-dropout",
    label: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting",
    sentimentScore: 0.51,
  },
  { id: "paper-adam", label: "Adam: A Method for Stochastic Optimization", sentimentScore: 0.62 },
];

const BAR_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#a4de6c",
  "#d0ed57",
  "#8dd1e1",
  "#ffbb28",
];

const getSummaryStats = (data: typeof DOCS_SENTIMENT) => {
  const avg = data.reduce((sum, d) => sum + d.sentimentScore, 0) / data.length;
  const positive = data.filter((d) => d.sentimentScore > 0.05).length;
  const negative = data.filter((d) => d.sentimentScore < -0.05).length;
  const neutral = data.length - positive - negative;
  const mostPositive = data.reduce(
    (max, d) => (d.sentimentScore > max.sentimentScore ? d : max),
    data[0]
  );
  const mostNegative = data.reduce(
    (min, d) => (d.sentimentScore < min.sentimentScore ? d : min),
    data[0]
  );
  return {
    avg,
    positive,
    negative,
    neutral,
    mostPositive,
    mostNegative,
  };
};

const SentimentAnalysis = () => {
  const stats = getSummaryStats(DOCS_SENTIMENT);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden">
      <div className="w-[95%] max-w-[900px] mb-6 flex flex-col gap-6 pt-24">
        {/* top row: avg / positive / negative / neutral */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Average */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
            <span className="text-gray-500 text-sm">Average</span>
            <span className="text-2xl font-semibold">{stats.avg.toFixed(2)}</span>
          </div>

          {/* Positive */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
            <span className="text-green-600 text-sm">Positive</span>
            <span className="text-xl font-semibold">{stats.positive}</span>
          </div>

          {/* Negative */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
            <span className="text-red-600 text-sm">Negative</span>
            <span className="text-xl font-semibold">{stats.negative}</span>
          </div>

          {/* Neutral */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
            <span className="text-gray-600 text-sm">Neutral</span>
            <span className="text-xl font-semibold">{stats.neutral}</span>
          </div>
        </div>

        {/* bottom row: most positive / most negative */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Most Positive */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-col">
            <span className="text-green-600 text-sm">Top “😊” Paper</span>
            <span className="font-medium">{stats.mostPositive.label}</span>
            <span className="text-green-600 text-lg font-semibold">
              {stats.mostPositive.sentimentScore.toFixed(2)}
            </span>
          </div>

          {/* Most Negative */}
          <div className="bg-white p-4 rounded-lg shadow flex flex-col">
            <span className="text-red-600 text-sm">Top “☹️” Paper</span>
            <span className="font-medium">{stats.mostNegative.label}</span>
            <span className="text-red-600 text-lg font-semibold">
              {stats.mostNegative.sentimentScore.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="95%" height={400} className="pb-12">
        <BarChart
          data={DOCS_SENTIMENT}
          layout="vertical"
          margin={{ top: 24, right: 32, left: 32, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[-1, 1]}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            label={{
              value: "Sentiment Score",
              position: "insideBottom",
              offset: -8,
              style: { fontFamily: withFallback("Segoe UI"), fontSize: 14 },
            }}
            tick={{
              fontFamily: withFallback("Segoe UI"),
              fontSize: 12,
            }}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={200}
            tick={{
              fontFamily: withFallback("Segoe UI"),
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{ fontFamily: withFallback("Segoe UI") }}
            labelStyle={{ fontFamily: withFallback("Segoe UI") }}
          />
          <Bar
            dataKey="sentimentScore"
            isAnimationActive={false}
            radius={[4, 4, 4, 4]}
            fill="#8884d8"
          >
            {DOCS_SENTIMENT.map((entry, index) => (
              <Cell key={entry.id} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
            <LabelList
              dataKey="sentimentScore"
              position="right"
              formatter={(v: number) => v.toFixed(2)}
              style={{ fontFamily: withFallback("Segoe UI"), fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentAnalysis;
