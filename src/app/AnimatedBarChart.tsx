import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart, registerables} from 'chart.js';

Chart.register(...registerables);

class AnimatedBarChart extends React.Component {
  render() {
    var { data, options } = this.props;

    return (
      <div style={{width:'97%'}}>
        <Bar data={data} options={options} />
      </div>
    );
  }
}

export default AnimatedBarChart;