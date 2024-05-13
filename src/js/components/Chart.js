const ctx = document.getElementById("myChart");

const data = {
    labels : [1, 2, 3, 4, 5],
    datasets: [
        {
            label: 'Score',
            data: [2, 6, 10, 16, 20],
            borderColor: 'blue',
            fill: true,
            cubicInterpolationMode: 'monotone',
            tension: 0.4
        }
    ]
}

function getGradient(ctx, chartArea) {
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    let width = chartWidth;
    let height = chartHeight;
    gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, '#c5ecfa');
    gradient.addColorStop(0.5, '#c5ecfa');
    gradient.addColorStop(1, 'red');
  
    return gradient;
  }

const custom_canvas_background_color = {
    id: 'custom_canvas_background_color',
    beforeDraw: (chart, args, options) => {
        const {
            ctx,
            chartArea: { top, right, bottom, left, width, height },
            scales: { x, y },
        } = chart;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        // ctx.fillStyle = '#c5ecfa';
        ctx.fillStyle = getGradient(ctx, { top, right, bottom, left, width, height })
        ctx.fillRect(left, top, width, height);
        ctx.restore();
    },
};

new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: ''
            },
        },
        interaction: {
            intersect: false
        },
        scales: {
            x: {
              display: true,
              title: {
                display: true
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Score'
              },
            //   suggestedMin: 0,
            //   suggestedMax: 200
            }
        },
    },
    plugins: [custom_canvas_background_color]
})

// ctx.style.backgroundColor = 'blue'