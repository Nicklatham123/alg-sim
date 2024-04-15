import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface AnimatedBarChartProps {
  data: any; // Adjust the type according to your data structure
  options: any; // Adjust the type according to your options structure
}

class AnimatedBarChart extends React.Component<AnimatedBarChartProps> {
  render() {
    const { data, options } = this.props;

    return (
      <div style={{ width: '97%' }}>
        <Bar data={data} options={options} />
      </div>
    );
  }
}

export default AnimatedBarChart;
