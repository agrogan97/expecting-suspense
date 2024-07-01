const ctx = document.getElementById("myChart");

const data = {
    labels : [0], // x-axis
    datasets: [
        {
            label: 'Score',
            data: [0], // y-axis
            borderColor: 'blue',
            fill: true,
            cubicInterpolationMode: 'monotone',
            stepped: 'middle',
            tension: 0.1,
            min: 0,
            max: 30,
            yAxisID: "y"
        },
        {
            label: 'Score2',
            data: [0], // y-axis
            borderColor: 'blue',
            fill: true,
            cubicInterpolationMode: 'monotone',
            stepped: 'middle',
            tension: 0.1,
            min: 0,
            max: 30,
            yAxisID: "yright"
        },
    ]
}

const test_bg_area = {
    id: 'test_bg_area',
    beforeDatasetsDraw: (chart, args, options) => {
        const {
            ctx,
            chartArea: { top, right, bottom, left, width, height },
            scales: { x, y },
        } = chart;

        ctx.fillStyle = 'rgba(255, 0, 0, 0.54)'; // red
        ctx.fillRect(left+1, y.getPixelForValue(10), width-0.5, top - y.getPixelForValue(10)) // left, top, width, height

        ctx.fillStyle = 'rgba(0, 31, 142, 0.47)'; // blue
        ctx.fillRect(left, top - (top - y.getPixelForValue(10)), width, y.getPixelForValue(y.min) - y.getPixelForValue(10)) // left, top, width, height
    }
}

var scoreChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Player Score', 
                text: (tooltipContext) => {
                    return "Player Score"
                },
                color: "#000",
                font: {
                    family: "Times New Roman",
                    size: 32,
                },
                padding: {top: 20, left: 0, right: 0, bottom: 0},
            },
            tooltip: {
                callbacks: {
                    label: (tooltipContext) => {
                        if (tooltipContext == undefined) {
                            return "0"
                        }
                        else {
                            return `Card ${tooltipContext.parsed.x} | Score: ${tooltipContext.parsed.y}` 
                        }
                        
                    },
                    title: () => {
                        return "Player Score"
                    },
                    footer: (tooltipContext) => {
                        return (tooltipContext[0].parsed.y > 10 ? "Bust!" : "")
                    }
                }
            },
            legend: {
                display: false
            }
        },
        interaction: {
            intersect: false
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: "Cards Drawn",
                    color: "#000",
                    font: {
                        family: "Times New Roman",
                        size: 24,
                    },
                },
                ticks: {
                    color: "#000",
                    font: {
                        size: 16,
                    }
                }
            },
            y: {
                display: true,
                position: "left",
                grid: {
                    drawOnChartArea: false,
                },
                title: {
                    display: true,
                    text: 'Score',
                    color: "#000",
                    font: {
                        family: "Times New Roman",
                        size: 24
                    },
                },
                ticks: {
                    display: true,
                    color: "#000",
                    stepSize: 1,
                    font: {
                        size: 16,
                    }
                },
                beginAtZero: true,
                // grace: '5%',
                suggestedMin: 0,
                suggestedMax: 25
            },
            yright: {
                display: true,
                position: "right",
                title: {
                    display: true,
                    text: 'Score',
                    color: "#000",
                    font: {
                        family: "Times New Roman",
                        size: 24
                    },
                },
                ticks: {
                    display: true,
                    color: "#000",
                    stepSize: 1,
                    font: {
                        size: 16,
                    }
                },
                beginAtZero: true,
                // grace: '5%',
                suggestedMin: 0,
                suggestedMax: 25
            }
        },
    },
    plugins: [
        test_bg_area, 
    ]
})

function addChartData(val, label){
    scoreChart.data.datasets[0].data.push(val);
    scoreChart.data.datasets[1].data.push(val);
    scoreChart.data.labels.push(label);
    scoreChart.update();
}

function resetChart(){
    scoreChart.data.datasets[0].data = [0];
    scoreChart.data.datasets[1].data = [0];
    scoreChart.data.labels = [0];
    scoreChart.update();
}