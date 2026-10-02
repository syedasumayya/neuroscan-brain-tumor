import { classLabel } from "@/lib/format";

export default function ConfusionMatrix({ classes, matrix }: { classes: string[]; matrix: number[][] }) {
  const totals = matrix.map((row) => row.reduce((a, b) => a + b, 0));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" className="p-2 text-left text-xs font-medium text-muted">
              Truth \ Predicted
            </th>
            {classes.map((c) => (
              <th key={c} scope="col" className="border-b border-line p-2 text-center text-xs font-medium text-muted">
                {classLabel(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={classes[i]}>
              <th scope="row" className="border-r border-line p-2 text-left text-xs font-medium text-muted">
                {classLabel(classes[i])}
              </th>
              {row.map((value, j) => (
                <td
                  key={j}
                  className={`p-2 text-center tabular-nums ${
                    i === j
                      ? "bg-clear-soft font-semibold text-clear"
                      : value > 0
                        ? "bg-signal-soft text-signal"
                        : "text-muted"
                  }`}
                >
                  {value}
                  {totals[i] > 0 && <span className="ml-1 text-[10px] opacity-70">({Math.round((value / totals[i]) * 100)}%)</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}